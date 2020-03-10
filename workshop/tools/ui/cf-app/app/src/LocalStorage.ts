import 'rxjs/add/operator/toPromise';

class Cookies { // cookies doesn't work with Android default browser / Ionic

  private session_id: string = null;

  delete_sessionId() {
    this.session_id = null;
    document.cookie = 'session_id=; expires=Wed, 29 Jun 2016 00:00:00 UTC';
  }

  get_sessionId() {
    return document
      .cookie.split('; ')
      .filter(x => x.indexOf('session_id') === 0)
      .map(x => x.split('=')[1])
      .pop() || this.session_id || '';
  }

  set_sessionId(val: string) {
    document.cookie = `session_id=${val}`;
    this.session_id = val;
  }
}

export class RPCService {
  private http_auth: string;
  private cookies: Cookies;
  private uniq_id_counter: number = 0;
  private shouldManageSessionId: boolean = false; // try without first
  private context: any = JSON.parse(localStorage.getItem('user_context')) || { lang: 'en_US' };
  private headers: Headers;
  getItem(key: string) {
    if (typeof localStorage != 'undefined') {
      const ret = localStorage.getItem(key);
      return JSON.parse(ret);
    }
    return 1;
  }
  saveItem(key, data) {
    if (typeof localStorage != 'undefined') {
      return localStorage.setItem(key, data);
    }
    return 1;
  }
  getLocalStorage() {
    return window['global'].localStorage || null;
  }
  loadFromStorage(key: string) {
    try {
      if (this.getLocalStorage()) {
        return this.getLocalStorage().getItem(key);
      } else {
        return '';
      }
    } catch (e) {
      console.error('storage problem ');
      return null;
    }
  }
  saveToStorage(key: string, val: string) {
    if (this.getLocalStorage()) {
      this.getLocalStorage().setItem(key, val);
    }
  }

  public init(configs: any = {}) {

  }

  public config() {

  }

}
