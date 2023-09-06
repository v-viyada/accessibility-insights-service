// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { registerAzureServicesToContainer } from 'azure-services';
import { setupRuntimeConfigContainer } from 'common';
import * as inversify from 'inversify';
import { registerLoggerToContainer } from 'logger';

export function setupReportGeneratorRunnerContainer(): inversify.Container {
    const container = new inversify.Container({ autoBindInjectable: true, skipBaseClassChecks: true });
    setupRuntimeConfigContainer(container);
    registerLoggerToContainer(container);
    registerAzureServicesToContainer(container);

    return container;
}
