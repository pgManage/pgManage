##INSTRUCTIONS FOR INSTALLING PGMANAGE BEHIND NGINX

In the typical case, you'll want to install pgManage behind a firewall, then VPN or tunnel to the server and use your browser to access pgManage through the tunnel. You can do all that without setting pgManage up behind a web server.

But there may be a case where you want to make an instance of pgManage accessible through a web server. In that case these instructions may appeal to you.

The general idea is for the web browser to communicate with the web server under SSL or TLS. Then pass the unencrypted request to the pgManage server. This way you can publish more than one secure website on the default TLS port 443. This prevents you from needing to specify a port when connecting to pgManage and simplifies firewall setup for multiple pgManage servers behind one web server. This configuration is called a reverse proxy.

If your web server is NOT on the same server as the pgManage server then using a reverse proxy can offload the TLS overhead to the web server but now you have the problem of the web server talking to the pgManage server in the clear. Usually, this is NOT what you want. You'll need to set up a secure tunnel from the web server to the pgManage server or protect the traffic from your web server to pgManage. 

####Here is a sample NGINX configuration:

server {
        listen                          443;
        server_name                     domain-name.com;

        ssl                             on;
        ssl_certificate                 /path/to/domain-name.com.crt;
        ssl_certificate_key             /path/to/domain-name.com.key;
        ssl_session_cache               shared:SSL:20m;
        ssl_session_timeout             5m;
        ssl_protocols                   TLSv1.2 TLSv1.1 TLSv1;
        ssl_ciphers                     ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK;
        ssl_prefer_server_ciphers       on;

        gzip                            on;
        gzip_types                      *;

        location / {
                proxy_pass http://127.0.0.1:8080;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_connect_timeout	    300s;
                proxy_send_timeout          300s;
                proxy_read_timeout          1d;
                send_timeout                300s;
        }

}

