import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { chromium } from 'playwright';

@Injectable()
export class Crawling {
  async getLocalHospitaldata(site: string) {
    const start: any = new Date();
  
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
  
    const end: any = new Date()
    const t = end - start;
    console.log(`소요시간(${site}) : ${t}ms`);
  
    return results;
  };

  async getNearbyHospitals(emogList: string[]) {
    const start: any = new Date();

    // emogList = ['A1100010', 'A1100011', 'A1400015'];
    const results: string[] = [];

    // await axios({
    //   url: `https://portal.nemc.or.kr:444/medi_info/dashboards/dash_total_emer_org_popup_for_egen.do?&emogList=${emogList[0]}&emogList=${emogList[1]}&emogList=${emogList[2]}&rltmEmerCd=O001&rltmCd=O017&rltmCd=O008&rltmCd=O006&rltmCd=O011&rltmCd=O007&rltmCd=O012&rltmCd=O016&rltmCd=O038&rltmCd=O022&afterSearch=org&theme=WHITE&refreshTime=60&spreadAllMsg=allSpread&searchYn=Y`,
    //   method: 'GET',
    //   timeout: 2000,
    //   responseType: 'arraybuffer',
    // }).then(response => {


      // // 브라우저 실행
      // const browser = await puppeteer.launch({headless: 'new'});
    
      // // 페이지 생성
      // const page = await browser.newPage();
      
      // // 크롤링할 대상 사이트로 이동
      // await page.goto(`https://portal.nemc.or.kr:444/medi_info/dashboards/dash_total_emer_org_popup_for_egen.do?&emogList=${emogList[0]}&emogList=${emogList[1]}&emogList=${emogList[2]}&rltmEmerCd=O001&rltmCd=O017&rltmCd=O008&rltmCd=O006&rltmCd=O011&rltmCd=O007&rltmCd=O012&rltmCd=O016&rltmCd=O038&rltmCd=O022&afterSearch=org&theme=WHITE&refreshTime=60&spreadAllMsg=allSpread&searchYn=Y`);
  
      // // 데이터 가져오기
      // const content = await page.content();


      const browser = await chromium.launch({
        headless: true,
      })
      const context = await browser.newContext({});
      const page = await context.newPage();
      await page.goto(`https://portal.nemc.or.kr:444/medi_info/dashboards/dash_total_emer_org_popup_for_egen.do?&emogList=${emogList[0]}&emogList=${emogList[1]}&emogList=${emogList[2]}&rltmEmerCd=O001&rltmCd=O017&rltmCd=O008&rltmCd=O006&rltmCd=O011&rltmCd=O007&rltmCd=O012&rltmCd=O016&rltmCd=O038&rltmCd=O022&afterSearch=org&theme=WHITE&refreshTime=60&spreadAllMsg=allSpread&searchYn=Y`)
      const content = await page.content();
      await browser.close();


      // const $ = cheerio.load(response.data);
      const $ = cheerio.load(content);
      const time = $('#area_top_info > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(1)');
      results.push(time.text().replace(/\s+/g,' '));
      
      $('#area_dashboards').each((idx, element) => {
        const $data = cheerio.load(element);
        const name = $data('#area_dashboards > div > div.dash_header > div > span > a').text().replace(/\s+/g,' ');
        const ungeup = $data('#area_dashboards > div > div.dash_data > div:nth-child(2) > table > tbody > tr > td:nth-child(1) > div.data_data.emer_bed.data_td_O001 > span:nth-child(2)').text().replace(/\s+/g,' ');
        const susul = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(2) > td:nth-child(2) > div.data_data.data_td_O022`).text().replace(/\s+/g,' ');
        const singyeong = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(4) > div.data_data.data_td_O011`).text().replace(/\s+/g,' ');
        const sinseng = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(2) > div.data_data.data_td_O008`).text().replace(/\s+/g,' ');
        const hyungbu = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(7) > div.data_data.data_td_O016`).text().replace(/\s+/g,' ');
        const ilban = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(1) > div.data_data.data_td_O017`).text().replace(/\s+/g,' ');
        const ibwon = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(2) > td:nth-child(1) > div.data_data.data_td_O038`).text().replace(/\s+/g,' ');
        const naeggwa = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(3) > div.data_data.data_td_O006`).text().replace(/\s+/g,' ');
        const weggwa = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(5) > div.data_data.data_td_O007`).text().replace(/\s+/g,' ');
        const singyeongwe = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(6) > div.data_data.data_td_O012`).text().replace(/\s+/g,' ');
        
        results.push(`${name} 응급실: ${ungeup}, 수술실: ${susul}, 신경중환자실: ${singyeong}, 신생아중환자실: ${sinseng}, 흉부중환자실: ${hyungbu}, 일반중환자실: ${ilban}, 입원실: ${ibwon}, 내과중환자실: ${naeggwa}, 외괴중환자실: ${weggwa}, 신경외과중환자실: ${singyeongwe}`);
      });
    // })
      
      const end: any = new Date()
      const t = end - start;
      console.log(`소요시간 : ${t}ms`);
    
      return results;
    }
  
}
