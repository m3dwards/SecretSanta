(ns secret-santa-web.handler
    (:require [compojure.core :refer :all]
      [compojure.route :as route]
      [compojure.handler :refer [site]]
      [ring.middleware.resource :refer [wrap-resource]]
      [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
      [ring.middleware.content-type :refer [wrap-content-type]]
      [ring.middleware.not-modified :refer [wrap-not-modified]]
      [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
      [ring.middleware.cookies :refer [wrap-cookies]]
      [ring.util.response :refer [resource-response content-type]]
      [ring.adapter.jetty :as jetty]
      [environ.core :refer [env]]
      [secret-santa-web.models.migrations :refer [migrate]]
      [postal.core :refer [send-message]]
      [clojure.java.jdbc :as sql]
      [clj-time.core :as t]
      [clj-time.format :as f]
      [clj-time.coerce :as c]
      [clj-time.jdbc]))

(def iso-date-pattern (re-pattern "^\\d{4}-\\d{2}-\\d{2}.*"))

(defn date? [date-str]
      (when (and date-str (string? date-str))
            (re-matches iso-date-pattern date-str)))

(defn json->datetime [json-str]
      (when (date? json-str)
            (if-let [res (c/from-string json-str)]
                    res
                    nil)))                                  ;; you should probably throw an exception or something here !

(defn unpack-date [row]
      (c/to-string (row :date)))
;;(f/unparse (c/to-date-time "dd.MM.yyyy hh:mm") (row :date)))

(defn unpack-venue [row]
      (row :venue))

(def db (or (System/getenv "DATABASE_URL")
            "postgresql://localhost:5432/secret-santa"))

(defn has-event? []
      (-> (sql/query db ["select count(*) from events"]) first :count pos?))

(defn has-user? [email]
      (-> (sql/query db ["select count(*) from users where email = ?" email]) first :count pos?))

(defn get-user-id [email]
      (-> (sql/query db ["select id from users where email = ?" email]) first :id))

(defn get-user-id-from-token [token]
      (-> (sql/query db ["select \"user\" from user_tokens where token = ?" (java.util.UUID/fromString token)]) first :user))

(defn get-user-from-token [token]
      (-> (sql/query db ["select u.id, u.name from user_tokens ut join users u on u.id = ut.\"user\" where ut.token = ?" (java.util.UUID/fromString token)]) first))

(defn get-dates [event_id]
      (map unpack-date (sql/query db ["select \"date\" from config_dates where event = ?" (read-string event_id)])))

(defn get-venues [event_id]
      (map unpack-venue (sql/query db ["select venue from config_venues where event = ?" (read-string event_id)])))

(defn create-event [name]
      (sql/insert! db :events [:name] [name]))

(defn create-user [email]
      (sql/insert! db :users [:email] [email]))

(defn delete-preferences [user event]
      (sql/execute! db ["delete from date_preferences where \"user\" = ? and event = ?" user event])
      (sql/execute! db ["delete from venue_preference where \"user\" = ? and event = ?" user event]))

(defn insert-date-preferences [user event date]
      (print "\nDate\n") (print (json->datetime (date :date))) (print "\n") (flush)
      ;(try
      (sql/insert! db :date_preferences ["\"user\"" :event :date :available] [user event (json->datetime (date "date")) (date "available")])
      ; (catch Exception e (print (.getNextException e)) (flush))
      ;)
      )

(defn insert-venue-preference [user event venue]
      ;(try
      (sql/insert! db :venue_preference ["\"user\"" :event :venue] [user event venue])
      ; (catch Exception e (print (.getNextException e)) (flush))
      ;)
      )

(defn save-preferences [pref]
      (print pref) (print "\n") (flush)
      (print (pref "email")) (flush)
      (when (not (has-event?)) (create-event "SecretSanta"))
      (when (not (has-user? (pref "email"))) (create-user (pref "email")))
      (let [user-id (get-user-id (pref "email"))]
           (delete-preferences user-id 1)
           (doseq [date (pref "dates")] (insert-date-preferences user-id 1 date))
           (insert-venue-preference user-id 1 (pref "venue")))
      (print pref) (flush)
      "saved")

(defn save-token [email token]
      (when (not (has-user? email)) (create-user email))
      (let [user_id (get-user-id email)]
           (sql/execute! db ["delete from user_tokens where \"user\" = ?" user_id])
           (try
             (sql/insert! db :user_tokens ["\"user\"" :token] [user_id token])
             (catch Exception e
               (prn "caught" (.getNextException e))))
           )
      token)

(defn make-token []
      (java.util.UUID/randomUUID))

(defn email-token [email token]
      (send-message {:host "smtp.sendgrid.net"
                     :user (System/getenv "SENDGRID_USERNAME")
                     :pass (System/getenv "SENDGRID_PASSWORD")
                     :port 587}
                    {:from    "santa@secretsanta.lol"
                     :to      email
                     :subject "Log in to Secret Santa"
                     :body    [{:type "text/html" :content (str "Your special login link is <a href='http://www.secretsanta.lol/token/"
                                                                (str token)
                                                                "'>http://www.secretsanta.lol/token/"
                                                                (str token)
                                                                "</a> <br> <br> Santa")}]}))

(defn send-auth-token [email]
      (->> (make-token)
           (save-token email)
           (email-token email))
      "Sent auth token")

(defn check-token [token]
      (-> (sql/query db ["select count(*) from user_tokens where token = ?" (java.util.UUID/fromString token)]) first :count pos?))

(defn reply-with-cookie [token]
      (if (check-token token)
        {:status  303
         :headers {"Location" "/"}
         :cookies {"session_id" {:value token :http-only true :path "/"}}
         :body    "Redirect"}
        "Bad token"
        ))

(defn user-info [token]
      (content-type {:body (get-user-from-token token)} "text/json"))



;; check if user has buying for - return it
;; allocate random user - return it
;; check if there are only 5 left - if so allocate all remaining
;; update collected date

(defn get-current-buying-for [user-id event-id]
      (-> (sql/query db ["select u.id, u.name from user_buying_for ubf join users u on u.id = ubf.buyingfor where ubf.\"user\" = ? AND event = ?" user-id (read-string event-id)]) first))


(defn get-unallocated-users [user_id event_id]
      (sql/query db ["select u.id from users u where not exists (select 1 from user_buying_for where \"user\" = u.id AND event = ?)" user_id (read-string event_id)]))


(defn allocate-random-user [user_id event_id]
      (get-unallocated-users user_id event_id)
      (content-type {:body {:id 1 :name "random user"}} "text/json")
      )

(defn get-buying-for [event_id token]
      (let [user_id (get-user-id-from-token token)]
           (if user_id
             (let [buying_for (get-current-buying-for user_id event_id)]
                  (if buying_for
                    (content-type {:body buying_for} "text/json")
                    (allocate-random-user user_id event_id)))
             "Bad auth")
           )
      )

(defroutes app-routes
           (GET "/" [] (content-type (resource-response "index.html" {:root "public"}) "text/html"))
           (GET "/backend" [] "Hello backend")
           (GET "/broken" [] (/ 1 0))
           (GET "/event/:event_id" [event_id] "{venueSelected: true, venue: 'The Red Lion', dateSelected: true, date: '01/02/2015 19:00', namesAvailable: false}")
           (GET "/event/:event_id/dates" [event_id] (get-dates event_id))
           (POST "/event/:specific/dates" [specific] ("saved dates"))
           (GET "/event/:event_id/venues" [event_id] (get-venues event_id))
           (POST "/event/:event_id/venues" [event_id] ("saved venues"))
           (GET "/event/:id/preferences" {{{token :value} "session_id"} :cookies {event_id :event_id} :params} "{selectedDates: [], venue: 'The Red Lion',attending: true, doingPresents: true}")
           (POST "event/:event_id/preferences" pref (save-preferences (pref :body)))
           (GET "/user" {{{token :value} "session_id"} :cookies} (user-info token))
           (POST "/login" {{email "email"} :body} (send-auth-token email))
           (POST "/event/:event_id/reveal-name" {{{token :value} "session_id"} :cookies {event_id :event_id} :params} (get-buying-for event_id token))
           (GET "/token/:token" [token] (reply-with-cookie token))
           (route/not-found "<html><body><img src='/img/404.png' style='max-width:100%'/></body></html>")
           )

(defn wrap-exception [f]
      (fn [request]
          (try (f request)
               (catch Exception e
                 (do (print (.getMessage e)) (flush)
                     {:status 500
                      :body   "<html><body><img src='img/500.png' style='max-width:100%'/></body></html>"})))))

(defn ignore-trailing-slash
      [handler]
      (fn [request]
          (let [uri (:uri request)]
               (handler (assoc request :uri (if (and (not (= "/" uri))
                                                     (.endsWith uri "/"))
                                              (subs uri 0 (dec (count uri)))
                                              uri))))))

(def app
  (-> app-routes
      (ignore-trailing-slash)
      (wrap-defaults (assoc site-defaults :security (assoc (site-defaults :security) :anti-forgery false)))
      (wrap-content-type)
      (wrap-not-modified)
      ;;(wrap-exception)
      (wrap-json-response)
      (wrap-json-body)
      (wrap-cookies)
      ))


(defn -main [& [port]]
      (migrate)
      (let [port (Integer. (or port (env :port) 5000))]
           (jetty/run-jetty (site #'app) {:port port :join? false})))
