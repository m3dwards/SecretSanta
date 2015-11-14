(ns secret-santa-web.models.migrations
  (:require [clojure.java.jdbc :as sql]
            ))

(def spec (or (System/getenv "DATABASE_URL")
              "postgresql://localhost:5432/secret-santa"))

(defn db-initialised? []
  (-> (sql/query spec
                 [(str "select count(*) from information_schema.tables "
                       "where table_name='version'")])
      first :count pos?))

(defn migrate []
  (when (not (db-initialised?))
    (print "Creating database structure...") (flush)
    (sql/db-do-commands spec
                        (sql/create-table-ddl
                         :version
                         [:version :int "NOT NULL"]))
    (println " done")))
