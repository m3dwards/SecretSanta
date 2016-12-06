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
      (sql/execute! db ["delete from present_preference where \"user\" = ? and event = ?" user event])
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

(defn insert-present-preference [user event doing-presents]
      ;(try
      (sql/insert! db :present_preference ["\"user\"" :event :wants_presents] [user event doing-presents])
      ; (catch Exception e (print (.getNextException e)) (flush))
      ;)
      )

(defn save-preferences [token body event-id]
      ;; (print (pref "email")) (flush)
      (let [user-id (get-user-id-from-token token)]
           (delete-preferences user-id event-id)
           (doseq [date (body "dates")] (insert-date-preferences user-id event-id date))
           (insert-venue-preference user-id event-id (body "venue"))
           (insert-present-preference user-id event-id (body "doingPresents")))
      "saved")

(defn save-token [email token]
  (let [user_id (get-user-id email)]
    (sql/execute! db ["delete from user_tokens where \"user\" = ?" user_id])
    (sql/insert! db :user_tokens ["\"user\"" :token] [user_id token]))
  token)

(defn make-token []
      (java.util.UUID/randomUUID))

(defn email-user [email message]
  (send-message {:host "smtp.sendgrid.net"
                 :user (System/getenv "SENDGRID_USERNAME")
                 :pass (System/getenv "SENDGRID_PASSWORD")
                 :port 587}
                {:from    "santa@secretsanta.lol"
                 :to      email
                 :subject "Log in to Secret Santa"
                 :body    [{:type "text/html" :content message}]}))

(defn email-token-event [email event-id message token]
  (email-user email (str "Your special login link is <a href='http://www.secretsanta.lol/event/" event-id "/token/"
                         (str token)
                         "'>http://www.secretsanta.lol/event/" event-id "/token/"
                         (str token)
                         "</a> <br> <br>"
                         message
                         "<br> <br> Santa")))

(defn email-token [email token]
  (email-user email (str "Your special login link is <a href='http://www.secretsanta.lol/token/"
                          (str token)
                          "'>http://www.secretsanta.lol/token/"
                          (str token)
                          "</a> <br> <br> Santa")))

(defn send-auth-token [email]
      (if (has-user? email)
        (do (->> (make-token)
                 (save-token email)
                 (email-token email))
            (content-type {:body {:valid true}} "text/json"))
        (content-type {:body {:valid false}} "text/json")))

(defn email-all-users [event-id message]
  (let [emails (map #(:email %) (sql/query db ["select email from users u join user_event e on e.user = u.id and e.event = ?" event-id]))]
    (doseq [email emails]
      (->> (make-token)
           (save-token email)
           ;;(email-token-event email event-id message)
           )))
  (content-type {:body "Message sent"} "text/json"))

(defn check-token [token]
      (-> (sql/query db ["select count(*) from user_tokens where token = ?" (java.util.UUID/fromString token)]) first :count pos?))

(defn reply-with-cookie-event [token event-id]
      (if (check-token token)
        {:status  303
         :headers {"Location" (str "/#/event/" event-id)}
         :cookies {"session_id" {:value token :http-only true :path "/" :expires "Sun, 20 Dec 2099 13:53:30 GMT"}}
         :body    "Redirect"}
        "Bad token"
        ))

(defn reply-with-cookie [token]
  (if (check-token token)
    {:status  303
     :headers {"Location" (str "/#/events")}
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
             (content-type {:status 401} "text/json"))
           )
      )


(defn admin-delete-dates [event]
      ;(try
      (sql/execute! db ["delete from config_dates where event = ?" (Integer. event)])
       ;(catch Exception e (print (.getNextException e)) (flush))
      ;)
      )

(defn admin-insert-date-config [event date]
      (sql/insert! db :config_dates [:event :date] [(Integer. event) (json->datetime date)]))

(defn is-admin [user-id, event-id]
  (-> (sql/query db ["select count(*) from user_event where \"user\" = ? and event = ?" user-id (Integer. event-id)]) first :count pos?))

(defn admin-save-dates [token event-id dates]
  (let [user_id (get-user-id-from-token token)]
    (if (is-admin user_id event-id)
      (do
        (admin-delete-dates event-id)
        (doseq [date dates] (admin-insert-date-config event-id date))
        (content-type {:body "Saved"} "text/json"))
      (content-type {:status 401} "text/json"))))

(defn admin-delete-venues [event]
  (sql/execute! db ["delete from config_venues where event = ?" (Integer. event)]))

(defn admin-insert-venue-config [event venue]
  (sql/insert! db :config_venues [:event :venue] [(Integer. event) venue]))

(defn admin-save-venues [token event-id venues]
  (let [user_id (get-user-id-from-token token)]
    (if (is-admin user_id event-id)
      (do
        (admin-delete-venues event-id)
        (doseq [venue venues] (admin-insert-venue-config event-id venue))
        (content-type {:body "Saved"} "text/json"))
      (content-type {:status 401} "text/json"))))

(defn admin-create-event [token name]
      (let [user_id (get-user-id-from-token token)]
        (if user_id
          (do
             (sql/insert! db :events [:name :preferences_available :names_available] [name true false])
             (let [event_id  (-> (sql/query db ["select id from events where name = ?" name]) first :id)]
               (sql/insert! db :user_event [:event "\"user\"" :admin] [event_id user_id true])
               (content-type {:body {:event_id event_id}} "text/json")))
        (content-type {:status 401} "text/json"))))


(defn get-event-info [token event-id]
  (let [event (-> (sql/query db ["select * from events where id = ?" (read-string event-id)]) first)]
  (content-type {:body {:name (:name event) :preferencesAvailable (:preferences_available event)  :venue (:venue event) :date (if (:date event) (.toDate (:date event))) :namesAvailable (:names_available event)}} "text/json")))

(defn get-user-preferences [token event-id]
  (let [user_id (get-user-id-from-token token)]
    (if user_id
      (do
        (let [dates (sql/query db ["select * from date_preferences where available = true and \"user\" = ? and event = ?" user_id (read-string event-id)])]
          (let [venue (-> (sql/query db ["select * from venue_preference where \"user\" = ? and event = ?" user_id (read-string event-id)]) first)]
            (let [present-pref (-> (sql/query db ["select * from present_preference where \"user\" = ? and event = ?" user_id (read-string event-id)]) first)]
              (content-type {:body {:selectedDates (map #(.toDate (:date %)) dates) :venue (:venue venue) :doingPresents (:wants_presents present-pref)}} "text/json"))))))))

(defn get-no-go-dates [token event-id]
  (let [user_id (get-user-id-from-token token)]
    (if (is-admin user_id event-id)
      (let [user-dates (sql/query db ["select name, date from users u join date_preferences d on d.user = u.id where d.available = false and d.event = ?" (read-string event-id)])]
        (content-type {:body (map #(hash-map :name (:name %) :date (.toDate (:date %))) user-dates)} "text/json"))
      (content-type {:status 401} "text/json"))))

(defn add-user [token event-id body]
  (let [user_id (get-user-id-from-token token)]
    (if (is-admin user_id event-id)
      (do
        (if (not (has-user? (body "email"))) (sql/query db ["Insert into users (name, email) values (?, ?) returning id" (body "name") (body "email")]))
        (let [inserted-user-id (get-user-id (body "email"))]
          (sql/insert! db :user_event [:event "\"user\"" :admin] [event-id inserted-user-id (body "admin")])
          (content-type {:body "saved"} "text/json")))
      (content-type {:status 401} "text/json"))))

(defn get-users-for-event [token event-id]
  (let [user_id (get-user-id-from-token token)]
    (print token) (flush)
    (if (is-admin user_id event-id)
      (content-type {:body (sql/query db ["select u.*, e.admin, c.collected_on as \"collected_name_on\"
from users u 
join user_event e on e.user = u.id and e.event = ? 
left join user_buying_for c on c.user = u.id and c.event = e.event" event-id])} "text/json")
      (content-type {:status 401} "text/json"))))

(defn delete-user [token event-id email]
  (let [user_id (get-user-id-from-token token)]
    (if (or (is-admin user_id event-id) (= user_id (get-user-id email))) ;; you can delete a user if admin or yourself from any event
      (content-type {:body (sql/execute! db ["delete from user_event where event = ? and \"user\" = ?" event-id (get-user-id email)])} "text/json")
      (content-type {:status 401} "text/json"))))

(defn get-user-events [token]
  (let [user-id (get-user-id-from-token token)]
    (content-type {:body (sql/query db ["select e.id, e.name from events e join user_event u on u.user = ? and u.event = e.id" user-id])} "text/json")))

(defn email-all-for-event [token event-id message]
  (let [user_id (get-user-id-from-token token)]
    (if (is-admin user_id event-id)
      (email-all-users event-id message)
      (content-type {:status 401} "text/json"))
  (content-type {:body "Message sent"} "text/json")))

(defroutes app-routes
  (GET "/" [] (content-type (resource-response "index.html" {:root "public"}) "text/html"))
  (GET "/backend" [] "Hello backend")
  (GET "/broken" [] (/ 1 0))

  (GET "/event/:event_id" [event_id] (get-event-info "" event_id))
  (POST "/event" {{{token :value} "session_id"} :cookies {event_id :event_id} :params {name "name"} :body} (admin-create-event token name))
  (GET "/events" {{{token :value} "session_id"} :cookies {event_id :event_id} :params {name "name"} :body} (get-user-events token))

  (GET "/event/:event_id/dates" [event_id] (get-dates event_id))
  (POST "/event/:event_id/dates" {{{token :value} "session_id"} :cookies {event_id :event_id} :params {dates "dates"} :body} (admin-save-dates token event_id dates)) ;; admin, save dates

  (GET "/event/:event_id/venues" [event_id] (get-venues event_id))
  (POST "/event/:event_id/venues" {{{token :value} "session_id"} :cookies {event_id :event_id} :params {venues "venues"} :body} (admin-save-venues token event_id venues)) ;; admin, save venues

  (GET "/event/:event_id/preferences" {{{token :value} "session_id"} :cookies {event_id :event_id} :params} (get-user-preferences token event_id))
  (POST "/event/:event_id/preferences" {{{token :value} "session_id"} :cookies {event_id :event_id} :params body :body} (save-preferences token body (Integer. event_id)))

  (DELETE "/event/:event_id/user" {{{token :value} "session_id"} :cookies {event_id :event_id} :params {email "email"} :body} (delete-user token (Integer. event_id) email))
  (POST "/event/:event_id/user" {{{token :value} "session_id"} :cookies {event_id :event_id} :params body :body} (add-user token (Integer. event_id) body))
  (GET "/event/:event_id/users" {{{token :value} "session_id"} :cookies {event_id :event_id} :params body :body} (get-users-for-event token (Integer. event_id)))

  (POST "/event/:event_id/email-all-users" {{{token :value} "session_id"} :cookies {event_id :event_id} :params {message "message"} :body} (email-all-for-event token (Integer. event_id) message))

  (GET "/user" {{{token :value} "session_id"} :cookies} (user-info token))
  (POST "/login" {{email "email"} :body} (send-auth-token email))

  (POST "/event/:event_id/reveal-name" {{{token :value} "session_id"} :cookies {event_id :event_id} :params} (get-buying-for event_id token))
  (GET "/event/:event_id/token/:token" [event_id token] (reply-with-cookie-event token event_id))
  (GET "/token/:token" [token] (reply-with-cookie token))

  (GET "/event/:event_id/no-go-dates" {{{token :value} "session_id"} :cookies {event_id :event_id} :params} (get-no-go-dates token event_id))

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
