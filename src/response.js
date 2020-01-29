/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';

const { PassThrough } = require('stream');

const getStream = require('get-stream');

/**
 * Convert a NodeJS Buffer to an ArrayBuffer
 *
 * @see https://stackoverflow.com/a/31394257
 *
 * @param {Buffer} buf
 * @returns {ArrayBuffer}
 */
const toArrayBuffer = (buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

/**
 * Wrapper for the Fetch API Response class, providing support for buffering
 * the body stream and thus allowing repeated reads of the body.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
class ResponseWrapper {
  /**
   * @param {Response} res
   */
  constructor(res) {
    this._res = res;
    this.headers = res.headers;
    this.ok = res.ok;
    this.status = res.status;
    this.statusText = res.statusText;
    this.redirected = res.redirected;
    this.type = res.type;
    this.url = res.url;
    this.httpVersion = res.httpVersion;
    this.bodyUsed = false;
    this._body = null;
  }

  async _ensureBodyConsumed() {
    if (!this._body) {
      this._body = await getStream.buffer(await this._res.readable());
    }
  }

  get body() {
    const stream = new PassThrough();
    stream.end(this._body);
    return stream;
  }

  async readable() {
    await this._ensureBodyConsumed();
    return this.body;
  }

  async arrayBuffer() {
    await this._ensureBodyConsumed();
    return toArrayBuffer(this._body);
  }

  async text() {
    await this._ensureBodyConsumed();
    return this._body.toString();
  }

  async json() {
    return JSON.parse(await this.text());
  }
}

module.exports = { ResponseWrapper };
