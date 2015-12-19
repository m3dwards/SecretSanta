(ns secret-santa-web.handler
    (:require [compojure.core :refer :all]
      [compojure.route :as route]
      [compojure.handler :refer [site]]
      [ring.middleware.resource :refer [wrap-resource]]
      [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
      [ring.middleware.content-type :refer [wrap-content-type]]
      [ring.middleware.not-modified :refer [wrap-not-modified]]
      [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
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

(defn save-token [event_id email token]
      (when (not (has-user? email)) (create-user email))
      (let [user_id (get-user-id email)]
           (sql/execute! db ["delete from user_tokens where \"user\" = ? and event = ?" user_id (read-string event_id)])
           (try
             (sql/insert! db :user_tokens [:event "\"user\"" :token] [(read-string event_id) user_id token])
             (catch Exception e
               (prn "caught" (.getNextException e))))
           ))

(defn make-token []
      (java.util.UUID/randomUUID))

(defn email-token [email token]
      ()
      (send-message {:host "smtp.sendgrid.net"
                     :user (System/getenv "SENDGRID_PASSWORD")
                     :pass (System/getenv "SENDGRID_USERNAME")
                     :port 587}
                    {:from    "santa@secretsanta.lol"
                     :to      email
                     :subject "Log in to Secret Santa"
                     :body    [{:type "text/html" :content (str "Your special login link is <a href='http://www.secretsanta.lol/token/"
                                                                (str token)
                                                                "'>http://www.secretsanta.lol/token/"
                                                                (str token)
                                                                "</a> <br> <br> Santa")}]}))

(defn send-auth-token [event_id email]
      (->> (make-token)
           (save-token event_id email)
           (email-token event_id email))
      "Sent auth token")

(defroutes app-routes
           (GET "/" [] (content-type (resource-response "index.html" {:root "public"}) "text/html"))
           (GET "/backend" [] "Hello backend")
           (GET "/broken" [] (/ 1 0))
           (GET "/event/:event_id/dates" [event_id] (get-dates event_id))
           (POST "/event/:specific/dates" [specific] ("saved dates"))
           (GET "/event/:event_id/venues" [event_id] (get-venues event_id))
           (POST "/event/:event_id/venues" [event_id] ("saved venues"))
           (POST "/preferences" pref (save-preferences (pref :body)))
           (POST "/event/:event_id/login" {{event_id :event_id} :params {email "email"} :body} (send-auth-token event_id email))
           (POST "/event/:event_id/reveal-name" [event_id] "Christopher")
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
      ))


(defn -main [& [port]]
      (migrate)
      (let [port (Integer. (or port (env :port) 5000))]
           (jetty/run-jetty (site #'app) {:port port :join? false})))
