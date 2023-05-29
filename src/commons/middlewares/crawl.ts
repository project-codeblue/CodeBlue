import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

let crawl = async (site: string) => {
  let start: any = new Date();

  // 브라우저 실행
  const browser = await puppeteer.launch({headless: 'new'});

  // 페이지 생성
  const page = await browser.newPage();

  // Request 요청
  await page.setRequestInterception(true);

  page.on('request', interceptedRequest => {
    let data = {
      'method': 'POST',
      'postData': `emrusi_sidoname=${site}`,
      'headers': {
        ...interceptedRequest.headers(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    interceptedRequest.continue(data);
  })

  // 크롤링할 대상 사이트로 이동
  await page.goto('https://www.medisvc.com/hospital/fo/availablebedslist.sd');

  // 데이터 가져오기
  const content = await page.content();

  // Close browser.
  await browser.close();

  const $ = cheerio.load(content);
  const time = $('#wrapper > div > section:nth-child(2) > div.container.pb-0 > div > div > div > div > h3');
  const results = [];
  results.push(time.text().replace(/\s+/g,' '));
  $('#frm > div:nth-child(6) > div > div.table-responsive > table').each((idx, element) => {
    const $data = cheerio.load(element);
    results.push($data('tbody > tr:nth-child(1)').text().replace(/\s+/g,' '));
  });

  let end: any = new Date()
  let t = end - start;
  console.log(`소요시간(${site}) : ${t}ms`);

  return results;
};

export {crawl};