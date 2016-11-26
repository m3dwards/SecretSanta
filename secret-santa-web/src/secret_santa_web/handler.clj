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
      [clj-time.local :as l]
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
      (-> (sql/query db ["select u.id, u.name, u.email from user_tokens ut join users u on u.id = ut.\"user\" where ut.token = ?" (java.util.UUID/fromString token)]) first))

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

;;attending
;;doingPresents

(defn save-token [email token]
      (when (not (has-user? email)) (create-user email))
      (let [user_id (get-user-id email)]
           ;;(sql/execute! db ["delete from user_tokens where \"user\" = ?" user_id])
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
      (if (has-user? email)
        (do (->> (make-token)
                 (save-token email)
                 (email-token email))
            (content-type {:body {:valid true}} "text/json"))
        (content-type {:body {:valid false}} "text/json")
        ))

(defn check-token [token]
      (-> (sql/query db ["select count(*) from user_tokens where token = ?" (java.util.UUID/fromString token)]) first :count pos?))

(defn reply-with-cookie [token]
      (if (check-token token)
        {:status  303
         :headers {"Location" "/"}
         :cookies {"session_id" {:value token :http-only true :path "/" :expires "Sun, 20 Dec 2099 13:53:30 GMT"}}
         :body    "Redirect"}
        "Bad token"
        ))

(defn user-info [token]
      (if token
          (content-type {:body (get-user-from-token token)} "text/json")))



;; check if user has buying for - return it
;; allocate random user - return it
;; check if there are only 5 left - if so allocate all remaining
;; update collected date

(defn get-current-buying-for [user-id event-id]
      (-> (sql/query db ["select u.id, u.name from user_buying_for ubf join users u on u.id = ubf.buyingfor where ubf.\"user\" = ? AND event = ?" user-id (read-string event-id)]) first))


(defn get-random-unallocated-user [user_id event_id]
      (-> (sql/query db [(str "select u.id, u.name from users u "
                              "JOIN present_preference pp on u.id = pp.user and pp.event = ? AND pp.wants_presents = true "
                              "where u.id <> ? "
                              "AND not exists (select * from user_buying_for where buyingfor = u.id AND event = ?)")  (read-string event_id) user_id (read-string event_id)]) rand-nth))

(defn number-of-remaining [event_id]
      (-> (sql/query db [(str "select count(*) from users u "
                              "JOIN present_preference pp on u.id = pp.user and pp.event = ? AND pp.wants_presents = true "
                              "where "
                              "not exists (select * from user_buying_for where buyingfor = u.id AND event = ?)")  (read-string event_id) (read-string event_id)]) first :count))


(defn save-allocation [event_id user_id buying_for]
      (sql/insert! db :user_buying_for [:event "\"user\"" :buyingfor :collected_on] [(Integer. event_id) user_id buying_for (c/to-sql-time (l/local-now))])
  )

(defn save-allocation-no-time [event_id user_id buying_for]
      (sql/insert! db :user_buying_for [:event "\"user\"" :buyingfor] [(Integer. event_id) user_id buying_for])
      )

(defn allocate-random-user [user_id event_id]
      (let [allocated (get-random-unallocated-user user_id event_id)]
           (save-allocation event_id user_id (allocated :id))
           (content-type {:body allocated} "text/json")
           ))

(defn update-collected [event user buying_for]
      (sql/execute! db ["update user_buying_for set collected_on = ? where \"user\" = ? and event = ?" (c/to-sql-time (l/local-now)) user (Integer. event)])
      (content-type {:body buying_for} "text/json")
      )

(defn get-users-who-have-not-collected [event-id]
      (sql/query db [(str "select u.id from users u "
                          "JOIN present_preference pp on u.id = pp.user and pp.event = ? AND pp.wants_presents = true "
                          "where not exists (select 1 from user_buying_for ubf where ubf.\"user\" = u.id AND event = ?)") (read-string event-id) (read-string event-id)]))

(defn get-users-to-be-bought-for [event-id]
      (sql/query db [(str "select u.id from users u "
                          "JOIN present_preference pp on u.id = pp.user and pp.event = ? AND pp.wants_presents = true "
                          "where not exists (select 1 from user_buying_for ubf where ubf.buyingfor = u.id AND event = ?)") (read-string event-id) (read-string event-id)]))

(defn rotate [xs] (cons (last xs) (drop-last xs)))

(defn zip-lists-random [users_who_have_not_collected users_to_be_bought_for]
      (let [zipped (zipmap users_who_have_not_collected (shuffle users_to_be_bought_for))]
           (if (= (count (filter (fn [x] (= (first x) (second x))) zipped)) 0)
             zipped
             (zip-lists-random users_who_have_not_collected users_to_be_bought_for))))

(defn allocate-for-event [event_id]
      (let [users_who_have_not_collected (map :id (get-users-who-have-not-collected event_id)) ]
           (let [users_to_be_bought_for (map :id (get-users-to-be-bought-for event_id))   ]
                (doseq [pair (zip-lists-random users_who_have_not_collected users_to_be_bought_for)]
                       (save-allocation-no-time event_id (first pair) (second pair)))

                ))
      )

(defn allocate-all-when-few [event_id]
      (when (< (number-of-remaining event_id) 6) (allocate-for-event event_id))
      )
(defn user-can-have-name [event_id user_id]
      (-> (sql/query db ["select count(*) from users u JOIN present_preference pp on u.id = pp.user and pp.event = ? AND pp.wants_presents = true where u.id = ?" (Integer. event_id) user_id]) first :count pos?))


(defn get-buying-for [event_id token]

      (allocate-all-when-few event_id)
      (let [user_id (get-user-id-from-token token)]
           (if user_id
             (if (user-can-have-name event_id user_id)
               (let [buying_for (get-current-buying-for user_id event_id)]
                    (if buying_for
                      (update-collected event_id user_id buying_for)
                      (allocate-random-user user_id event_id)))
               (content-type {:body {:allowed false}} "text/json"))
             (content-type {:code 401} "text/json"))
           )
      )

(defroutes app-routes
           (GET "/" [] (content-type (resource-response "index.html" {:root "public"}) "text/html"))
           (GET "/backend" [] "Hello backend")
           (GET "/broken" [] (/ 1 0))

           (GET "/event/:event_id" [event_id] "{venueSelected: true, venue: 'The Red Lion', dateSelected: true, date: '01/02/2015 19:00', namesAvailable: false}")

           (GET "/event/:event_id/dates" [event_id] (get-dates event_id))
           (POST "/event/:specific/dates" [specific] ("saved dates")) ;; admin, save dates

           (GET "/event/:event_id/venues" [event_id] (get-venues event_id))
           (POST "/event/:event_id/venues" [event_id] ("saved venues")) ;; admin, save venues

           (GET "/event/:event_id/preferences" {{{token :value} "session_id"} :cookies {event_id :event_id} :params} "{selectedDates: [], venue: 'The Red Lion', attending: true, doingPresents: true}")
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
