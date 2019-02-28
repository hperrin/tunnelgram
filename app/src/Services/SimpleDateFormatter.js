import {format} from 'timeago.js';

export class SimpleDateFormatter {
  constructor (date) {
    if (date instanceof Date) {
      this.date = date;
    } else {
      this.date = new Date(date * 1000);
    }
  }

  format (style, length) {
    let options;

    switch (style) {
      case 'wymdhms':
        options = {
          weekday: length,
          year: 'numeric',
          month: length,
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        };
        break;
      case 'ymd':
        options = {
          year: 'numeric',
          month: length,
          day: 'numeric'
        };
        break;
      case 'md':
        options = {
          month: length,
          day: 'numeric'
        };
        break;
      case 'wh':
        options = {
          weekday: length,
          hour: 'numeric'
        };
        break;
      case 'ago':
        const str = format(this.date);
        return length === 'short' ? str.replace(/ ago$/gi, '') : str;
    }

    let formatter = new Intl.DateTimeFormat(undefined, options);
    return formatter.format(this.date);
  }
}
