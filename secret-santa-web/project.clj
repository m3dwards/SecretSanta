(defproject secret-santa-web "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :min-lein-version "2.0.0"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [compojure "1.4.0"]
                 [ring/ring-defaults "0.1.5"]
                 [ring/ring-jetty-adapter "1.4.0"]
                 [ring/ring-json "0.4.0"]
                 [environ "1.0.0"]
                 [clj-time "0.11.0"]
                 [org.clojure/java.jdbc "0.4.1"]
                 [com.draines/postal "1.11.3"]
                 [org.postgresql/postgresql "9.4-1201-jdbc41"]]
  :plugins [[lein-ring "0.9.7"]]
  :ring {:handler secret-santa-web.handler/app
         :init secret-santa-web.models.migrations/migrate}
  :profiles
  {:dev {:dependencies [[javax.servlet/servlet-api "2.5"]
                        [ring/ring-mock "0.3.0"]]}
   :production {:env {:production true}}}
  :uberjar-name "secret-santa.jar")
