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
            nil))) ;; you should probably throw an exception or something here !

(def db (or (System/getenv "DATABASE_URL")
                          "postgresql://localhost:5432/secret-santa"))

(defn has-event? []
  (-> (sql/query db ["select count(*) from events"]) first :count pos?))

(defn has-user? [email]
  (-> (sql/query db ["select count(*) from users where email = ?" email]) first :count pos?))

(defn create-event [name]
  (sql/insert! db :events [:name] [name]))

(defn create-user [email]
  (sql/insert! db :users [:email] [email]))

(defn delete-preferences [user event]
  (sql/execute! db ["delete from date_preferences where \"user\" = ? and event = ?" user event]))

(defn insert-preferences [user event date]
  (print "\nDate\n") (print (json->datetime (date :date))) (print "\n") (flush)
  ;(try
  (sql/insert! db :date_preferences ["\"user\"" :event :date :available] [user event (json->datetime "2015-02-01") (date "selected")])
 ; (catch Exception e (print (.getNextException e)) (flush))
  ;)
)
  
(defn save-preferences [pref]
  (print pref) (print "\n") (flush)
  (print (pref "email")) (flush)
  (when (not (has-event?)) (create-event "SecretSanta"))
  (when (not (has-user? (pref "email"))) (create-user (pref "email")))
  (delete-preferences 1 1)
  (insert-preferences 1 1 (first (pref "dates")))
  (print pref) (flush)
  "saved")

(defroutes app-routes
  (GET "/" [] (content-type (resource-response "index.html" {:root "public"}) "text/html"))
  (GET "/backend" [] "Hello backend")
  (GET "/broken" [] (/ 1 0))
  (POST "/preferences" pref (save-preferences (pref :body)))
  (route/not-found "<html><body><img src='/img/404.png' style='max-width:100%'/></body></html>")
  )

(defn wrap-exception [f]
  (fn [request]
    (try (f request)
      (catch Exception e
        (do (print (.getMessage e)) (flush)
         {:status 500
          :body "<html><body><img src='img/500.png' style='max-width:100%'/></body></html>"})))))

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
    (let [port (Integer. (or port (env :port) 5000))]
          (jetty/run-jetty (site #'app) {:port port :join? false})))
