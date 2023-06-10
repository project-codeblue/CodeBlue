import { Module, Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import { Client } from '@elastic/elasticsearch';
import { Reports } from 'src/reports/reports.entity';

@Injectable()
export class Elk {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async allSearch(): Promise<string[]> {
    const client = new Client({
      nodes: [`${this.config.elasticsearchIP}`],
    });
    const datas = await client.search({
      index: 'reports',
      size: 10000,
      query: {
        match_all: {},
      },
      sort: [
        {
          createdAt: {
            order: 'asc',
          },
        },
      ],
    });
    let result = [];

    for (const data of datas.hits.hits) {
        result.push(data._source);
    }
    return result;
  }

  async search(queries: object): Promise<string[]> {
    const date = queries['date'];
    const symptoms = queries['symptoms'];
    const symptom_level = queries['symptom_level'];
    const site = queries['site'];
    const name = queries['name'];

    const client = new Client({
      nodes: [`${this.config.elasticsearchIP}`],
    });
    const datas = await client.search({
      index: 'reports',
      size: 10000,
      query: {
        bool: {
          must: [
            {
              query_string: {
                default_field: 'date',
                query: '*' + date + '*',
              },
            },
            {
              query_string: {
                default_field: 'symptoms',
                query: '*' + symptoms + '*',
              },
            },
            {
              query_string: {
                default_field: 'symptom_level',
                query: '*' + symptom_level + '*',
              },
            },
            {
              query_string: {
                default_field: 'site',
                query: '*' + site + '*',
              },
            },
            {
              query_string: {
                default_field: 'name',
                query: '*' + name + '*',
              },
            },
          ],
        },
      },
      sort: [
        {
          createdat: {
            order: 'asc',
          },
        },
      ],
    });
    let result = [];

    for (const data of datas.hits.hits) {
        result.push(data._source);
    }
    return result;
  }
}
