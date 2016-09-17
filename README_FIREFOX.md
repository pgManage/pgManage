Firefox has an issue where if a cookie has a non-standard domain, it will not be recognized or saved.

For instance this will work:
```
www.wfprod.com
```
But not this:
```
www.wfprod
```

Because the cookie isn't saved, the login process seems to work... but the main menu won't work. The only known workaround right now is to use a standard domain.
