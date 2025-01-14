// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { inject, injectable } from 'inversify';
import { GlobalLogger } from 'logger';
import { AxeScanResults, Page } from 'scanner-global-library';
import { OnDemandPageScanResult, WebsiteScanResult } from 'storage-documents';
import { PageMetadata, PageMetadataGenerator, RunnerScanMetadata } from 'service-library';
import { isEmpty } from 'lodash';
import { AxeScanner } from '../scanner/axe-scanner';
import { DeepScanner } from './deep-scanner';

@injectable()
export class PageScanProcessor {
    public constructor(
        @inject(Page) private readonly page: Page,
        @inject(AxeScanner) private readonly axeScanner: AxeScanner,
        @inject(DeepScanner) private readonly deepScanner: DeepScanner,
        @inject(PageMetadataGenerator) private readonly pageMetadataGenerator: PageMetadataGenerator,
        @inject(GlobalLogger) private readonly logger: GlobalLogger,
    ) {}

    public async scan(
        runnerScanMetadata: RunnerScanMetadata,
        pageScanResult: OnDemandPageScanResult,
        websiteScanResult: WebsiteScanResult,
    ): Promise<AxeScanResults> {
        let axeScanResults: AxeScanResults;
        try {
            const pageMetadata = await this.pageMetadataGenerator.getMetadata(runnerScanMetadata.url, this.page, websiteScanResult);
            const state = this.getScannableState(pageMetadata);
            if (state.unscannable === true) {
                this.setAuthenticationResult(pageMetadata, pageScanResult);

                return state;
            }

            const enableAuthentication = pageScanResult.authentication?.hint !== undefined;
            await this.page.navigate(runnerScanMetadata.url, { enableAuthentication });

            this.setAuthenticationResult(pageMetadata, pageScanResult);

            if (!isEmpty(this.page.browserError)) {
                return { error: this.page.browserError, pageResponseCode: this.page.browserError.statusCode };
            }

            const pageState = await this.capturePageState();
            axeScanResults = await this.axeScanner.scan(this.page);
            axeScanResults = { ...axeScanResults, ...pageState };

            await this.deepScanner.runDeepScan(runnerScanMetadata, pageScanResult, websiteScanResult, this.page);
        } finally {
            await this.page.close();
        }

        return axeScanResults;
    }

    private getScannableState(pageMetadata: PageMetadata): AxeScanResults {
        if (pageMetadata.browserError !== undefined) {
            this.logger.logError(pageMetadata.browserError.message, {
                loadedUrl: pageMetadata.loadedUrl,
            });

            return {
                unscannable: true,
                scannedUrl: pageMetadata.loadedUrl,
                error: pageMetadata.browserError,
            };
        }

        return {
            unscannable: false,
            scannedUrl: pageMetadata.loadedUrl,
        };
    }

    private async capturePageState(): Promise<AxeScanResults> {
        const pageScreenshot = await this.page.getPageScreenshot();
        const pageSnapshot = await this.page.getPageSnapshot();

        return {
            pageSnapshot,
            pageScreenshot,
        };
    }

    private setAuthenticationResult(pageMetadata: PageMetadata, pageScanResult: OnDemandPageScanResult): void {
        if (pageMetadata.authentication !== true) {
            return;
        }

        const authenticationResult = this.page.authenticationResult;
        if (authenticationResult !== undefined) {
            pageScanResult.authentication = {
                ...pageScanResult.authentication,
                detected: pageMetadata.authenticationType,
                state: authenticationResult.authenticated === true ? 'succeeded' : 'failed',
            };
        } else {
            pageScanResult.authentication = {
                ...pageScanResult.authentication,
                detected: pageMetadata.authenticationType,
                state: 'unauthenticated',
            };
        }
    }
}
