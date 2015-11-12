(ns secret-santa-web.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [compojure.handler :refer [site]]
            [ring.middleware.resource :refer [wrap-resource]]
            [ring.middleware.content-type :refer [wrap-content-type]]
            [ring.middleware.not-modified :refer [wrap-not-modified]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.util.response :refer [resource-response content-type]]
            [ring.adapter.jetty :as jetty]
            [environ.core :refer [env]]))

(defroutes app-routes
  (GET "/" [] (content-type (resource-response "index.html" {:root "public"}) "text/html"))
  (GET "/backend" [] "Hello backend")
  (GET "/broken" [] (/ 1 0))
  (route/not-found "<html><body><img src='/img/404.png' style='max-width:100%'/></body></html>")
  )

(defn wrap-exception [f]
  (fn [request]
    (try (f request)
      (catch Exception e
         {:status 500
          :body "<html><body><img src='img/500.png' style='max-width:100%'/></body></html>"}))))

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
    (wrap-defaults site-defaults)
    (wrap-content-type)
    (wrap-not-modified)
    (wrap-exception)))


(defn -main [& [port]]
    (let [port (Integer. (or port (env :port) 5000))]
          (jetty/run-jetty (site #'app) {:port port :join? false})))
