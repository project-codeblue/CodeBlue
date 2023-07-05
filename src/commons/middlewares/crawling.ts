import * as cheerio from 'cheerio';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class Crawling {
  // 종합상황판 크롤링
  async getRealTimeHospitalsBeds(emogList: string[]) {

    let url = `https://portal.nemc.or.kr:444/medi_info/dashboards/dash_total_emer_org_popup_for_egen.do?`;
    emogList.forEach((e) => {
      url += `&emogList=${e}`;
    });
    url += `&rltmEmerCd=O001&rltmCd=O038&rltmCd=O022&afterSearch=org&theme=WHITE&refreshTime=60&spreadAllMsg=allClose&searchYn=Y`;

    const results: string[] = [];

    await axios({
      url: url,
      method: 'GET',
      responseType: 'arraybuffer',
    }).then((response) => {
      const $ = cheerio.load(response.data);

      const time = $('#area_top_info > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(1)',);
      results.push(time.text().replace(/\s+/g, ' '));

      $('#area_dashboards').each((idx, element) => {
        const $data = cheerio.load(element);
        const emogList = $data('#area_dashboards > div > div.dash_header > div > span > input.emogcode',).val();
        const name = $data('#area_dashboards > div > div.dash_header > div > span > a',).text().replace(/\s+/g, ' ');
        const ungeup = $data('#area_dashboards > div > div.dash_data > div:nth-child(2) > table > tbody > tr > td:nth-child(1) > div.data_data.emer_bed.data_td_O001 > span:nth-child(2)').text().replace(/\s+/g, ' ');
        const susul = $data(`#rltmList_${idx} > table > tbody > tr > td:nth-child(2) > div.data_data.data_td_O022`).text().replace(/\s+/g, ' ');
        const ibwon = $data(`#rltmList_${idx} > table > tbody > tr > td:nth-child(1) > div.data_data.data_td_O038`).text().replace(/\s+/g, ' ');

        results.push(
          `${emogList} / ${name} 응급실: ${ungeup}, 수술실: ${susul}, 입원실: ${ibwon}`,
        );
      });
    });

    return results;
  }
}
