// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type CookieScenario = {
    name: string;
    value: string;
    scenario: string;
};

export const getAllCookieScenarios = (): CookieScenario[] => {
    /**
     * Cookies:
     * - property:
     * c1 - Analytics
     * c2 - Social Media
     * c3 - Advertising
     *
     * - values:
     * Accepted = 2
     * Rejected = 1
     */
    return [
        {
            // All - accepted
            name: 'MSCC',
            scenario: 'All',
            value: 'cid=3nqibqsmahlqkom8tlvlek2q-c1=2-c2=2-c3=2',
        },
        {
            // Analytics - accepted
            name: 'MSCC',
            scenario: 'Analytics',
            value: 'cid=3nqibqsmahlqkom8tlvlek2q-c1=2-c2=0-c3=0',
        },
        {
            // Social Media - accepted
            name: 'MSCC',
            scenario: 'Social',
            value: 'cid=3nqibqsmahlqkom8tlvlek2q-c1=0-c2=2-c3=0',
        },
        {
            // Advertising - accepted
            name: 'MSCC',
            scenario: 'Advertising',
            value: 'cid=3nqibqsmahlqkom8tlvlek2q-c1=0-c2=0-c3=2',
        },
    ];
};
