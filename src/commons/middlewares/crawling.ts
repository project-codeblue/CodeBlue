import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class Crawling {
  // 메디서비스 크롤링
  async getLocalHospitaldata(site: string) {
    const start: any = new Date();

    // 브라우저 실행
    const browser = await puppeteer.launch({ headless: 'new' });

    // 페이지 생성
    const page = await browser.newPage();

    // Request 요청
    await page.setRequestInterception(true);

    page.on('request', (interceptedRequest) => {
      const data = {
        method: 'POST',
        postData: `emrusi_sidoname=${site}`,
        headers: {
          ...interceptedRequest.headers(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      interceptedRequest.continue(data);
    });

    // 크롤링할 대상 사이트로 이동
    await page.goto('https://www.medisvc.com/hospital/fo/availablebedslist.sd');

    // 데이터 가져오기
    const content = await page.content();

    // Close browser.
    await browser.close();

    const results: string[] = [];
    const $ = cheerio.load(content);
    
    const time = $('#wrapper > div > section:nth-child(2) > div.container.pb-0 > div > div > div > div > h3',);
    results.push(time.text().replace(/\s+/g, ' '));
    $('#frm > div:nth-child(6) > div > div.table-responsive > table').each(
      (idx, element) => {
        const $data = cheerio.load(element);
        results.push(
          $data('tbody > tr:nth-child(1)').text().replace(/\s+/g, ' '),
        );
      },
    );

    const end: any = new Date();
    const t = end - start;
    console.log(`소요시간(${site}) : ${t}ms`);

    return results;
  }

  // 종합상황판 크롤링
  async getNearbyHospitals(emogList: string[]) {
    const start: any = new Date();

    let url = `https://portal.nemc.or.kr:444/medi_info/dashboards/dash_total_emer_org_popup_for_egen.do?`;
    emogList.forEach((e) => {
      url += `&emogList=${e}`;
    });
    url += `&rltmEmerCd=O001&rltmCd=O017&rltmCd=O008&rltmCd=O006&rltmCd=O011&rltmCd=O007&rltmCd=O012&rltmCd=O016&rltmCd=O038&rltmCd=O022&afterSearch=org&theme=WHITE&refreshTime=60&spreadAllMsg=allSpread&searchYn=Y`;

    const results: string[] = [];

    await axios({
      url: url,
      method: 'GET',
      // timeout: 2000,
      responseType: 'arraybuffer',
    }).then((response) => {
      // 크롤링
      const $ = cheerio.load(response.data);

      const time = $('#area_top_info > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(1)',);
      results.push(time.text().replace(/\s+/g, ' '));

      $('#area_dashboards').each((idx, element) => {
        const $data = cheerio.load(element);
        const emogList = $data('#area_dashboards > div > div.dash_header > div > span > input.emogcode',).val();
        const name = $data('#area_dashboards > div > div.dash_header > div > span > a',).text().replace(/\s+/g, ' ');
        const ungeup = $data('#area_dashboards > div > div.dash_data > div:nth-child(2) > table > tbody > tr > td:nth-child(1) > div.data_data.emer_bed.data_td_O001 > span:nth-child(2)').text().replace(/\s+/g, ' ');
        const susul = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(2) > td:nth-child(2) > div.data_data.data_td_O022`).text().replace(/\s+/g, ' ');
        const singyeong = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(4) > div.data_data.data_td_O011`).text().replace(/\s+/g, ' ');
        const sinseng = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(2) > div.data_data.data_td_O008`).text().replace(/\s+/g, ' ');
        const hyungbu = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(7) > div.data_data.data_td_O016`).text().replace(/\s+/g, ' ');
        const ilban = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(1) > div.data_data.data_td_O017`).text().replace(/\s+/g, ' ');
        const ibwon = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(2) > td:nth-child(1) > div.data_data.data_td_O038`).text().replace(/\s+/g, ' ');
        const naeggwa = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(3) > div.data_data.data_td_O006`).text().replace(/\s+/g, ' ');
        const weggwa = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(5) > div.data_data.data_td_O007`).text().replace(/\s+/g, ' ');
        const singyeongwe = $data(`#rltmList_${idx} > table > tbody > tr:nth-child(1) > td:nth-child(6) > div.data_data.data_td_O012`).text().replace(/\s+/g, ' ');

        results.push(
          `${emogList} / ${name} 응급실: ${ungeup}, 수술실: ${susul}, 신경중환자실: ${singyeong}, 신생아중환자실: ${sinseng}, 흉부중환자실: ${hyungbu}, 일반중환자실: ${ilban}, 입원실: ${ibwon}, 내과중환자실: ${naeggwa}, 외과중환자실: ${weggwa}, 신경외과중환자실: ${singyeongwe}`,
        );
      });
    });

    const end: any = new Date();
    const t = end - start;
    console.log(`크롤링 소요시간 : ${t}ms`);

    return results;
  }

  // 네이버 지식인 크롤링
  async symptomCrawl() {
    const start: any = new Date();

    // 브라우저 실행
    const browser = await puppeteer.launch({ headless: false });

    // 페이지 생성
    const page = await browser.newPage();

    // 크롤링할 대상 사이트로 이동
    await page.goto('https://kin.naver.com/qna/expertAnswerList.naver?dirId=701');

    let data: string = '';

    for (let i = 1; i <= 20; i++) {
      await page.waitForSelector(`#au_board_list > tr:nth-child(${i}) > td.title > a`);
      await page.click(`#au_board_list > tr:nth-child(${i}) > td.title > a`);
      await page.waitForSelector(`#wrap > div.container-fluid`);
      // 데이터 가져오기
      const content = await page.content();
      const $ = cheerio.load(content);
      const qtitle = $('#content > div.question-content > div > div.c-heading._questionContentsArea.c-heading--default-old > div.c-heading__title > div > div').text().replace(/\s+/g, ' ');
      const qcontent = $('#content > div.question-content > div > div.c-heading._questionContentsArea.c-heading--default-old > div.c-heading__content').text().replace(/\s+/g, ' ');
      const acontent = $('#answer_1 > div._endContents.c-heading-answer__content > div._endContentsText.c-heading-answer__content-user').text().replace(/\s+/g, ' ');
      
      data += '-------------------질문-----------------------------\n';
      data += qtitle + '\n';
      data += qcontent + '\n';
      data += '-------------------답변-----------------------------\n'
      data += acontent + '\n\n\n';

      await page.goBack();
    }
    
    // Close browser.
    await browser.close();

    const files = fs.readdirSync('./crawl');

    const fileList = files.filter(file => file.startsWith('file'));

    if (fileList.length > 0) {
      const fileNames = fileList.map(file => file.split('.')[0]);

      const fileNumbers = fileNames.map(file => +file.split('file')[1]);

      fileNumbers.sort((a, b) => b - a);

      const max = fileNumbers[0];

      fs.writeFileSync(`./crawl/file${max+1}.txt`, data, 'utf-8');
    } else {
      fs.writeFileSync(`./crawl/file1.txt`, data, 'utf-8');
    }
  }
}
