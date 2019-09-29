'use strict'

var request = require('request');
var _ = require('lodash');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
var fs = require('fs');
var iconvlite = require('iconv-lite');
const cookiesFilename = 'cookies.txt';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

module.exports.fetch = function (urls) {
  return Promise.resolve()
  .then(() => {
    if (fs.existsSync(cookiesFilename)) {
      var cookies = JSON.parse(fs.readFileSync(cookiesFilename, 'utf8'));
      return cookies;
    }
    else {
      return new Promise((resolve, reject) => {
        request.post({
          url: 'https://www.1point3acres.com/bbs/member.php?mod=logging&action=login&loginsubmit=yes&infloat=yes&lssubmit=yes&inajax=1',
          form: {
            username: 'cpthk0',
            password: '1d147d2f77d9332a0da41f75a7a0eb51',
            quickforward: 'yes',
            handlekey: 'ls',
          }
        }, (err, res, body) => {
          if (err) {
            return reject(err);
          }
          var cookies = res.headers['set-cookie'];
          fs.writeFileSync(cookiesFilename, JSON.stringify(cookies));
          resolve(cookies);
        });
      });
    }
  })
  .then((cookies) => {
    var cookieJar = request.jar();
    cookies.forEach((cookie) => {
      cookieJar.setCookie(cookie, 'https://www.1point3acres.com/bbs/member.php?mod=logging&action=login&loginsubmit=yes&infloat=yes&lssubmit=yes&inajax=1');
    });
    return cookieJar;
  })
  .then((cookieJar) => {
    return urls.map((url) => {
      return new Promise((resolve, reject) => {
        request.get({
          url: url,
          jar: cookieJar,
          encoding: null
        }, (err, res, body) => {
          var data = iconvlite.decode(body, 'GB2312');
          resolve(data);
        });
      });
    });
  })
  .then((tasks) => {
    return Promise.all(tasks);
  });
};

module.exports.parse = function (fetch) {
  return Promise.resolve()
  .then(() => {
    return fetch.map((f) => {
      return new Promise((resolve, reject) => {
        let jsdom = new JSDOM(f);
        let dom = jsdom.window.document.querySelector('div#postlist > table > tbody .vwthd h1.ts span#thread_subject');
        if (!dom) {
          return reject(new Error('Dom is null'));
        }
        let title = dom.textContent;
        dom = jsdom.window.document.querySelector('div#postlist div.pct > div.pcb > span');
        if (!dom) {
          return reject(new Error('Dom is null'));
        }
        let metadata = dom.textContent;
        dom = jsdom.window.document.querySelector('div#postlist div.pct > div.pcb > div.t_fsz td[id^=postmessage_]');
        if (!dom) {
          return reject(new Error('Dom is null'));
        }
        let body = dom.textContent;
        resolve({title, metadata, body});
      });
    });
  })
  .then((tasks) => {
    return Promise.all(tasks);
  })
};

module.exports.write = function (data) {
  console.log(data)
};