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
            [clojure.java.jdbc :as sql]))

(def db (or (System/getenv "DATABASE_URL")
                          "postgresql://localhost:5432/secret-santa"))

(defn save-preferences [pref]

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
    (wrap-exception)
    (wrap-json-response)
    (wrap-json-body)
      ))


(defn -main [& [port]]
    (let [port (Integer. (or port (env :port) 5000))]
          (jetty/run-jetty (site #'app) {:port port :join? false})))
