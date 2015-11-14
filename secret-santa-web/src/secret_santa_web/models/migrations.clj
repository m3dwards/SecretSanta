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

(defn migrate []
  (init-db)
  (let [db-version (get-version)]
    (print (str "DB-Vesion: " db-version))
    (if (< db-version 1) (do (add-events-table)
                             (add-users-table)
                             (add-date-preferences-table) 
                             (set-version 1)))

    ))
