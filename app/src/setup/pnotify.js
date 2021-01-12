import { defaults, defaultModules } from '@pnotify/core';
import '@pnotify/core/dist/PNotify.css';
import * as PNotifyBootstrap4 from '@pnotify/bootstrap4';
import '@pnotify/bootstrap4/dist/PNotifyBootstrap4.css';
import * as PNotifyFontAwesome5 from '@pnotify/font-awesome5';
import * as PNotifyFontAwesome5Fix from '@pnotify/font-awesome5-fix';
import * as PNotifyMobile from '@pnotify/mobile';
import '@pnotify/mobile/dist/PNotifyMobile.css';

// PNotify defaults.
defaults.styling = 'bootstrap4';
defaults.icons = 'fontawesome5';
defaults.sticker = false;
defaultModules.set(PNotifyBootstrap4, {});
defaultModules.set(PNotifyFontAwesome5, {});
defaultModules.set(PNotifyFontAwesome5Fix, {});
defaultModules.set(PNotifyMobile, {});
