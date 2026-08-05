const dns = require("dns").promises;

(async () => {
  try {
    console.log(await dns.resolveSrv("_mongodb._tcp.cluster0.abqr7wd.mongodb.net"));
  } catch (err) {
    console.error(err);
  }
})();