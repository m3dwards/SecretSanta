(ns secret-santa-web.models.migrations
    (:require [clojure.java.jdbc :as sql]))

(def db (or (System/getenv "DATABASE_URL")
            "postgresql://localhost:5432/secret-santa"))

(defn db-initialised? []
      (-> (sql/query db
                     [(str "select count(*) from information_schema.tables "
                           "where table_name='version'")])
          first :count pos?))

(defn get-version []
      (-> (sql/query db ["select version from version"])
          (first)
          (:version)))

(defn set-version [version]
      (sql/update! db :version {:version version} ["1=1"]))

(defn init-db []
      (when (not (db-initialised?))
            (sql/db-do-commands db
                                (sql/create-table-ddl
                                  :version
                                  [:version :int "NOT NULL"]))
            (sql/insert! db :version [:version] [0])))

(defn add-users-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :users
                            [:id :serial "PRIMARY KEY"]
                            [:name :varchar "NULL"]
                            [:email :varchar "NULL"]
                            )))

(defn add-events-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :events
                            [:id :serial "PRIMARY KEY"]
                            [:name :varchar "NULL"]
                            )))

(defn add-date-preferences-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :date_preferences
                            [:id :serial "PRIMARY KEY"]
                            ["\"user\"" :int "references users (id) NOT NULL"]
                            [:event :int "references events (id) NOT NULL"]
                            [:date :timestamp "NOT NULL"]
                            [:available :boolean "NOT NULL"])))

(defn add-venue-preference-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :venue_preference
                            [:id :serial "PRIMARY KEY"]
                            ["\"user\"" :int "references users (id) NOT NULL"]
                            [:event :int "references events (id) NOT NULL"]
                            [:venue :varchar "NOT NULL"])))

(defn add-config-dates-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :config_dates
                            [:id :serial "PRIMARY KEY"]
                            [:event :int "references events (id) NOT NULL"]
                            [:date :timestamp "NOT NULL"])))

(defn add-config-venues-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :config_venues
                            [:id :serial "PRIMARY KEY"]
                            [:event :int "references events (id) NOT NULL"]
                            [:venue :varchar "NOT NULL"])))

(defn add-tokens-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :user_tokens
                            [:id :serial "PRIMARY KEY"]
                            ["\"user\"" :int "references users (id) NOT NULL"]
                            [:token :uuid "NOT NULL"]
                            [:expiry :timestamp]
                            )))

(defn add-present-preference-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :present_preference
                            [:id :serial "PRIMARY KEY"]
                            [:event :int "references events (id) NOT NULL"]
                            ["\"user\"" :int "references users (id) NOT NULL"]
                            [:wants_presents :boolean "NOT NULL"])))

(defn add-user-buying-for-table []
      (sql/db-do-commands db
                          (sql/create-table-ddl
                            :user_buying_for
                            [:id :serial "PRIMARY KEY"]
                            [:event :int "references events (id) NOT NULL"]
                            ["\"user\"" :int "references users (id) NOT NULL"]
                            [:buyingfor :int "references users (id) NOT NULL"]
                            [:collected_on :timestamp])))

(defn migrate []
      (init-db)
      (let [db-version (get-version)]
           (print (str "DB-Vesion: " db-version))
           (if (< db-version 1) (do (add-events-table)
                                    (add-users-table)
                                    (add-date-preferences-table)
                                    (set-version 1)))
           (if (< db-version 2) (do (add-config-dates-table)
                                    (add-config-venues-table)
                                    (set-version 2)))
           (if (< db-version 3) (do (add-venue-preference-table)
                                    (set-version 3)))
           (if (< db-version 4) (do (add-tokens-table)
                                    (set-version 4)))
           (if (< db-version 5) (do (add-present-preference-table)
                                    (set-version 5)))
           (if (< db-version 6) (do (add-user-buying-for-table)
                                    (set-version 6)))
           ))
