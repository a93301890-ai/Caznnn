import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const BOOKIES_BASE = 'https://bookiesapi.com/api/get.php';
const BOOKIES_LOGIN = 'vectorumiks';
const BOOKIES_TOKEN = '48843-5B4qFOEF2LuRAD7';

@Injectable()
export class BookiesApiService {
  private readonly logger = new Logger(BookiesApiService.name);

  private async request(params: Record<string, string>): Promise<any> {
    try {
      const { data } = await axios.get(BOOKIES_BASE, {
        params: {
          login: BOOKIES_LOGIN,
          token: BOOKIES_TOKEN,
          ...params,
        },
        timeout: 15000,
      });
      return data;
    } catch (err) {
      this.logger.error(`BookiesAPI error: ${err.message}`, err.stack);
      return { error: true, message: err.message };
    }
  }

  /** Live events from bet365 */
  async getLiveEvents(): Promise<any> {
    return this.request({ task: 'bet365live' });
  }

  /** Live odds for a specific game */
  async getLiveOdds(gameId: string, bookmaker = 'bet365'): Promise<any> {
    return this.request({
      task: 'liveodds',
      bookmaker,
      game_id: gameId,
    });
  }

  /** Prematch events for a sport */
  async getPrematchEvents(sport: string, bookmaker = 'bet365'): Promise<any> {
    return this.request({
      task: 'pre',
      bookmaker,
      sport,
    });
  }

  /** Prematch odds for a specific game */
  async getPrematchOdds(gameId: string, bookmaker = 'bet365'): Promise<any> {
    return this.request({
      task: 'preodds2',
      bookmaker,
      game_id: gameId,
    });
  }

  /** Result for a specific game */
  async getResult(gameId: string, bookmaker = 'bet365'): Promise<any> {
    return this.request({
      task: 'result',
      bookmaker,
      game_id: gameId,
    });
  }
}
