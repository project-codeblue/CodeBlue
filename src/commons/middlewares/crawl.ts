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

  // 지역 옵션 선택
  // 매개변수 site에 아래 지역 중 하나가 들어옵니다.
  /* 서울특별시 / 경기도 / 강원도 / 광주광역시 / 대구광역시
     대전광역시 / 부산광역시 / 울산광역시 / 인천광역시 / 경상남도
     경상북도 / 세종특별자치시 / 전라남도 / 전라북도 / 제주특별자치도
     충청남도 / 충청북도
  */
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

  // page.evaluate(() => {
  //   document.body.scrollTop = 200;
  // })

  // 지역 옵션 선택
  // 매개변수 site에 아래 지역 중 하나가 들어옵니다.
  /* 서울특별시 / 경기도 / 강원도 / 광주광역시 / 대구광역시
     대전광역시 / 부산광역시 / 울산광역시 / 인천광역시 / 경상남도
     경상북도 / 세종특별자치시 / 전라남도 / 전라북도 / 제주특별자치도
     충청남도 / 충청북도
  */
  // await page.select('#emrusi_sidoname', site);

  // // 검색 버튼을 클릭하여 POST 요청 (페이지 이동)
  // await page.click('#frm > div:nth-child(5) > div:nth-child(3) > a');

  // // 페이지 랜더링이 될 때까지 wait
  // await page.waitForSelector('#frm > div:nth-child(6) > div > div.table-responsive > table:nth-child(1) > tbody')

  // 데이터 가져오기
  // const reperenceTime = await page.$('#wrapper > div > section:nth-child(2) > div.container.pb-0 > div > div > div > div > h3');
  // const hospitals = await page.$x('//*[@id="frm"]/div[2]/div/div[1]/table');
  const content = await page.content();

  // Close browser.
  await browser.close();

  // let results = [];
  // let time = await reperenceTime.evaluate((element) => element.textContent)
  // time = time.replace(/\s+/g,'')
  // results.push(time);

  // for (let i = 1; i <= hospitals.length; i++){
  //   const h = await page.$(`#frm > div:nth-child(6) > div > div.table-responsive > table:nth-child(${i}) > tbody > tr`)
  //   let result = await h.evaluate((element) => element.textContent);
  //   results.push(result.replace(/\s+/g,' '));
  // }.

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