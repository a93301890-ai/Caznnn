import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type GamesListOptions = {
    img?: string;
    cdnUrl?: string;
};

type OpenGameOptions = {
    login: string;
    gameId: string;
    domain: string;
    exitUrl?: string;
    language?: string;
    demo?: string | number | boolean;
    cdnUrl?: string;
    bm?: string;
};

type GameSessionsLogOptions = {
    sessionsId: string;
    count?: number;
    page?: number;
};

type CreateHallOptions = {
    apiKey: string;
    agent: string;
    key: string;
    host: string;
    hall?: string;
    login: string;
    currency: string;
};

type ChangeHallConfigOptions = {
    hall: string;
    key: string;
    data?: Record<string, any>;
};

@Injectable()
export class GamesApiService {
    private readonly logger = new Logger(GamesApiService.name);

    private get baseUrl() {
        return (process.env.GAMES_API_BASE_URL || '').replace(/\/+$/, '');
    }

    private get hallId() {
        return process.env.GAMES_API_HALL_ID || '';
    }

    private get hallKey() {
        return process.env.GAMES_API_HALL_KEY || '';
    }

    private get defaultLanguage() {
        return process.env.GAMES_API_LANGUAGE || 'en';
    }

    private get defaultCdnUrl() {
        return process.env.GAMES_API_CDN_URL || '';
    }

    private get timeoutMs() {
        const raw = Number(process.env.GAMES_API_TIMEOUT_MS || 10000);
        return Number.isFinite(raw) ? raw : 10000;
    }

    private ensureConfigured(requireHall = true) {
        if (!this.baseUrl) {
            throw new BadRequestException('GAMES_API_BASE_URL is not set');
        }
        if (requireHall && (!this.hallId || !this.hallKey)) {
            throw new BadRequestException('GAMES_API_HALL_ID/HALL_KEY is not set');
        }
    }

    private buildApiUrl(path = '') {
        const suffix = path ? path.replace(/^\/+/, '') : '';
        return suffix ? `${this.baseUrl}/API/${suffix}` : `${this.baseUrl}/API/`;
    }

    private normalizeFlag(value?: string | number | boolean) {
        return value === true || value === 1 || value === '1' ? '1' : '0';
    }

    private async postToApi(path: string, payload: Record<string, any>) {
        const url = this.buildApiUrl(path);
        const { data } = await axios.post(url, payload, {
            timeout: this.timeoutMs,
            headers: { 'Content-Type': 'application/json' },
        });
        return data;
    }

    async getGamesList(options: GamesListOptions = {}) {
        this.ensureConfigured();
        const payload: Record<string, any> = {
            cmd: 'getGamesList',
            hall: this.hallId,
            key: this.hallKey,
        };
        if (options.img) payload.img = options.img;
        const cdnUrl = options.cdnUrl || this.defaultCdnUrl;
        if (cdnUrl) payload.cdnUrl = cdnUrl;

        const response = await this.postToApi('', payload);
        if (response?.status && response.status !== 'success') {
            try {
                return await this.postToApi('', { ...payload, cmd: 'gamesList' });
            } catch (error) {
                this.logger.warn('Fallback gamesList failed');
            }
        }
        return response;
    }

    async openGame(options: OpenGameOptions) {
        this.ensureConfigured();
        const payload: Record<string, any> = {
            cmd: 'openGame',
            hall: this.hallId,
            key: this.hallKey,
            domain: options.domain,
            exitUrl: options.exitUrl,
            language: options.language || this.defaultLanguage,
            login: options.login,
            gameId: options.gameId,
            demo: this.normalizeFlag(options.demo),
        };
        const cdnUrl = options.cdnUrl || this.defaultCdnUrl;
        if (cdnUrl) payload.cdnUrl = cdnUrl;
        if (options.bm) payload.bm = options.bm;
        return this.postToApi('openGame/', payload);
    }

    async gameSessionsLog(options: GameSessionsLogOptions) {
        this.ensureConfigured();
        return this.postToApi('', {
            cmd: 'gameSessionsLog',
            hall: this.hallId,
            key: this.hallKey,
            sessionsId: options.sessionsId,
            count: options.count,
            page: options.page,
        });
    }

    async jackpots() {
        this.ensureConfigured();
        return this.postToApi('', {
            cmd: 'jackpots',
            hall: this.hallId,
            key: this.hallKey,
        });
    }

    async createHall(options: CreateHallOptions) {
        this.ensureConfigured(false);
        return this.postToApi('', {
            cmd: 'createHall',
            api_key: options.apiKey,
            agent: options.agent,
            key: options.key,
            host: options.host,
            hall: options.hall ?? '',
            login: options.login,
            currency: options.currency,
        });
    }

    async changeHallConfig(options: ChangeHallConfigOptions) {
        this.ensureConfigured(false);
        const payload: Record<string, any> = {
            cmd: 'changeHallConfig',
            hall: options.hall,
            key: options.key,
        };
        if (options.data) payload.data = options.data;
        return this.postToApi('', payload);
    }
}
