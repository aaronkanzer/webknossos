// @flow
import _ from "lodash";
import type { Vector3, Vector4, Vector6, BoundingBoxType } from "oxalis/constants";
import Maybe from "data.maybe";
import window, { document, location } from "libs/window";
import pako from "pako";
import naturalSort from "javascript-natural-sort";
import type { APIUserType } from "admin/api_flow_types";

export type Comparator<T> = (T, T) => -1 | 0 | 1;
type UrlParamsType = { [key: string]: string };

function swap(arr, a, b) {
  let tmp;
  if (arr[a] > arr[b]) {
    tmp = arr[b];
    arr[b] = arr[a];
    arr[a] = tmp;
  }
}

naturalSort.insensitive = true;

function getRecursiveValues(obj: Object | Array<*> | string): Array<*> {
  return _.flattenDeep(getRecursiveValuesUnflat(obj));
}

function getRecursiveValuesUnflat(obj: Object | Array<*> | string): Array<*> {
  if (Array.isArray(obj)) {
    return obj.map(getRecursiveValuesUnflat);
  } else if (obj instanceof Object) {
    return Object.keys(obj).map(key => getRecursiveValuesUnflat(obj[key]));
  } else {
    return [obj];
  }
}

function cheapSort<T: string | number>(valueA: T, valueB: T): -1 | 0 | 1 {
  // $FlowFixMe It is not possible to express that valueA and valueB have the very same type
  if (valueA < valueB) return -1;
  // $FlowFixMe It is not possible to express that valueA and valueB have the very same type
  if (valueA > valueB) return 1;
  return 0;
}

export function enforce<A, B>(fn: A => B): (?A) => B {
  return (nullableA: ?A) => {
    if (nullableA == null) {
      throw new Error("Could not enforce while unwrapping maybe");
    }
    return fn(nullableA);
  };
}

export function maybe<A, B>(fn: A => B): (?A) => Maybe<B> {
  return (nullableA: ?A) => Maybe.fromNullable(nullableA).map(fn);
}

export function parseAsMaybe(str: ?string): Maybe<any> {
  try {
    const parsedJSON = JSON.parse(str || "");
    if (parsedJSON != null) {
      return Maybe.Just(parsedJSON);
    } else {
      return Maybe.Nothing();
    }
  } catch (exception) {
    return Maybe.Nothing();
  }
}

export function clamp(a: number, x: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

export function zeroPad(num: number, zeros: number = 0): string {
  let paddedNum = `${num.toString()}`;
  while (paddedNum.length < zeros) {
    paddedNum = `0${paddedNum}`;
  }
  return paddedNum;
}

export function roundTo(value: number, digits: number): number {
  const digitMultiplier = Math.pow(10, digits);
  return Math.round(value * digitMultiplier) / digitMultiplier;
}

export function capitalize(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

function intToHex(int: number, digits: number = 6): string {
  return (_.repeat("0", digits) + int.toString(16)).slice(-digits);
}

export function rgbToHex(color: Vector3): string {
  return `#${color.map(int => intToHex(int, 2)).join("")}`;
}

export function hexToRgb(hex: string): Vector3 {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function computeBoundingBoxFromArray(bb: ?Vector6): ?BoundingBoxType {
  if (bb == null) return null;

  const [x, y, z, width, height, depth] = bb;

  return {
    min: [x, y, z],
    max: [x + width, y + height, z + depth],
  };
}

export function computeArrayFromBoundingBox(bb: ?BoundingBoxType): ?Vector6 {
  return bb != null
    ? [
        bb.min[0],
        bb.min[1],
        bb.min[2],
        bb.max[0] - bb.min[0],
        bb.max[1] - bb.min[1],
        bb.max[2] - bb.min[2],
      ]
    : null;
}

export function compareBy<T>(
  collectionForTypeInference: Array<T>, // this parameter is only used let flow infer the used type
  selector: T => number,
  isSortedAscending: boolean = true,
): Comparator<T> {
  return (a: T, b: T) => {
    if (!isSortedAscending) {
      [a, b] = [b, a];
    }
    const valueA = selector(a);
    const valueB = selector(b);
    if (typeof valueA !== "number" || typeof valueB !== "number") {
      console.error(
        "Wrong compare method called (compareBy should only be called for numbers). Selector:",
        selector,
      );
      return 0;
    }
    return cheapSort(valueA, valueB);
  };
}

export function localeCompareBy<T>(
  collectionForTypeInference: Array<T>, // this parameter is only used let flow infer the used type
  selector: T => string,
  isSortedAscending: boolean = true,
  sortNatural: boolean = true,
): Comparator<T> {
  return (a: T, b: T) => {
    if (!isSortedAscending) {
      [a, b] = [b, a];
    }
    const valueA = selector(a);
    const valueB = selector(b);
    if (typeof valueA !== "string" || typeof valueB !== "string") {
      console.error(
        "Wrong compare method called (localeCompareBy should only be called for strings). Selector:",
        selector,
      );
      return 0;
    }
    // localeCompare is really slow, therefore, we use the naturalSort lib and a cheap sorting otherwise
    return sortNatural ? naturalSort(valueA, valueB) : cheapSort(valueA, valueB);
  };
}

export function stringToNumberArray(s: string): Array<number> {
  // remove leading/trailing whitespaces
  s = s.trim();
  // replace remaining whitespaces with commata
  s = s.replace(/,?\s+,?/g, ",");
  const stringArray = s.split(",");

  const result = [];
  for (const e of stringArray) {
    const newEl = parseFloat(e);
    if (!Number.isNaN(newEl)) {
      result.push(newEl);
    }
  }

  return result;
}

export function concatVector3(a: Vector3, b: Vector3): Vector6 {
  return [a[0], a[1], a[2], b[0], b[1], b[2]];
}

export function numberArrayToVector3(array: Array<number>): Vector3 {
  const output = [0, 0, 0];
  for (let i = 0; i < Math.min(3, array.length); i++) {
    output[i] = array[i];
  }
  return output;
}

export function numberArrayToVector6(array: Array<number>): Vector6 {
  const output = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < Math.min(6, array.length); i++) {
    output[i] = array[i];
  }
  return output;
}

export function point3ToVector3({ x, y, z }: { x: number, y: number, z: number }): Vector3 {
  return [x, y, z];
}

function isUserTeamManager(user: APIUserType): boolean {
  return _.findIndex(user.teams, team => team.isTeamManager) >= 0;
}

export function isUserAdmin(user: APIUserType): boolean {
  return user.isAdmin || isUserTeamManager(user);
}

export function getUrlParamsObject(): UrlParamsType {
  return getUrlParamsObjectFromString(location.search);
}

export function getUrlParamsObjectFromString(str: string): UrlParamsType {
  // Parse the URL parameters as objects and return it or just a single param
  return str
    .substring(1)
    .split("&")
    .reduce((result: UrlParamsType, value: string): UrlParamsType => {
      const parts = value.split("=");
      if (parts[0]) {
        const key = decodeURIComponent(parts[0]);
        if (parts[1]) {
          result[key] = decodeURIComponent(parts[1]);
        } else {
          result[key] = "true";
        }
      }
      return result;
    }, {});
}

export function getUrlParamValue(paramName: string): string {
  const params = getUrlParamsObject();
  return params[paramName];
}

export function hasUrlParam(paramName: string): boolean {
  const params = getUrlParamsObject();
  return Object.prototype.hasOwnProperty.call(params, paramName);
}

export function __range__(left: number, right: number, inclusive: boolean): Array<number> {
  const range = [];
  const ascending = left < right;
  // eslint-disable-next-line no-nested-ternary
  const end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}

export function __guard__<T, U>(value: ?T, transform: T => U) {
  return typeof value !== "undefined" && value !== null ? transform(value) : undefined;
}

export function sleep(timeout: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

export function animationFrame(): Promise<void> {
  return new Promise(resolve => {
    window.requestAnimationFrame(resolve);
  });
}

export function diffArrays<T>(
  stateA: Array<T>,
  stateB: Array<T>,
): { both: Array<T>, onlyA: Array<T>, onlyB: Array<T> } {
  const setA = new Set(stateA);
  const both = stateB.filter(x => setA.has(x));
  const bothSet = new Set(both);
  const onlyA = stateA.filter(x => !bothSet.has(x));
  const onlyB = stateB.filter(x => !bothSet.has(x));
  return { both, onlyA, onlyB };
}

export function zipMaybe<T, U>(maybeA: Maybe<T>, maybeB: Maybe<U>): Maybe<[T, U]> {
  return maybeA.chain(valueA => maybeB.map(valueB => [valueA, valueB]));
}

// Maybes getOrElse is defined as getOrElse(defaultValue: T): T, which is why
// you can't do getOrElse(null) without flow complaining
export function toNullable<T>(_maybe: Maybe<T>): ?T {
  return _maybe.isJust ? _maybe.get() : null;
}

// Filters an array given a search string. Supports searching for several words as OR query.
// Supports nested properties
export function filterWithSearchQueryOR<T: { +[string]: mixed }, P: $Keys<T>>(
  collection: Array<T>,
  properties: Array<P | (T => Object | Array<*> | string)>,
  searchQuery: string,
): Array<T> {
  if (searchQuery === "") {
    return collection;
  } else {
    const words = _.map(searchQuery.split(" "), element =>
      element.toLowerCase().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
    );
    const uniques = _.filter(_.uniq(words), element => element !== "");
    const pattern = `(${uniques.join("|")})`;
    const regexp = new RegExp(pattern, "igm");

    return collection.filter(model =>
      _.some(properties, fieldName => {
        const value = typeof fieldName === "function" ? fieldName(model) : model[fieldName];
        if (value != null && (typeof value === "string" || value instanceof Object)) {
          const values = getRecursiveValues(value);
          return _.some(values, v => v.toString().match(regexp));
        } else {
          return false;
        }
      }),
    );
  }
}

// Filters an array given a search string. Supports searching for several words as AND query.
// Supports nested properties
export function filterWithSearchQueryAND<T: { +[string]: mixed }, P: $Keys<T>>(
  collection: Array<T>,
  properties: Array<P | (T => Object | Array<*> | string)>,
  searchQuery: string,
): Array<T> {
  if (searchQuery === "") {
    return collection;
  } else {
    const words = _.map(searchQuery.split(" "), element =>
      element.toLowerCase().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
    );
    const uniques = _.filter(_.uniq(words), element => element !== "");
    const patterns = uniques.map(pattern => new RegExp(pattern, "igm"));

    return collection.filter(model =>
      _.every(patterns, pattern =>
        _.some(properties, fieldName => {
          const value = typeof fieldName === "function" ? fieldName(model) : model[fieldName];
          if (value !== null && (typeof value === "string" || value instanceof Object)) {
            const values = getRecursiveValues(value);
            return _.some(values, v => v.toString().match(pattern));
          } else {
            return false;
          }
        }),
      ),
    );
  }
}

export function millisecondsToMinutes(ms: number) {
  return ms / 60000;
}

export function minutesToMilliseconds(min: number) {
  return min * 60000;
}

export function isNoElementFocussed(): boolean {
  // checks whether an <input> or <button> element has the focus
  // when no element is focused <body> gets the focus
  return document.activeElement === document.body;
}

// https://stackoverflow.com/questions/25248286/native-js-equivalent-to-jquery-delegation#
export function addEventListenerWithDelegation(
  element: HTMLElement,
  eventName: string,
  delegateSelector: string,
  handlerFunc: Function,
) {
  const wrapperFunc = function(event: Event) {
    // $FlowFixMe Flow doesn't know native InputEvents
    for (let target = event.target; target && target !== this; target = target.parentNode) {
      // $FlowFixMe Flow doesn't know native InputEvents
      if (target.matches(delegateSelector)) {
        handlerFunc.call(target, event);
        break;
      }
    }
  };
  element.addEventListener(eventName, wrapperFunc, false);
  return { [eventName]: wrapperFunc };
}

export async function compress(data: Uint8Array | string): Promise<Uint8Array> {
  const DEFLATE_PUSH_SIZE = 65536;

  const deflator = new pako.Deflate({ gzip: true });
  for (let offset = 0; offset < data.length; offset += DEFLATE_PUSH_SIZE) {
    // The second parameter to push indicates whether this is the last chunk to be deflated
    deflator.push(
      data.slice(offset, offset + DEFLATE_PUSH_SIZE),
      offset + DEFLATE_PUSH_SIZE >= data.length,
    );
    // eslint-disable-next-line no-await-in-loop
    await sleep(1);
  }
  return deflator.result;
}

export function median8(dataArray: Array<number>): number {
  // Returns the median of an already *sorted* array of size 8 (e.g., with sortArray8)
  return Math.round((dataArray[3] + dataArray[4]) / 2);
}

export function mode8(arr: Array<number>): number {
  // Returns the mode of an already *sorted* array of size 8 (e.g., with sortArray8)
  let currentConsecCount = 0;
  let currentModeCount = 0;
  let currentMode = -1;
  let lastEl = null;
  for (let i = 0; i < 8; i++) {
    const el = arr[i];
    if (lastEl === el) {
      currentConsecCount++;
      if (currentConsecCount >= currentModeCount) {
        currentModeCount = currentConsecCount;
        currentMode = el;
      }
    } else {
      currentConsecCount = 1;
    }
    lastEl = el;
  }
  return currentMode;
}

export function sortArray8(arr: Array<number>): void {
  // This function sorts an array of size 8.
  // Swap instructions were generated here:
  // http://jgamble.ripco.net/cgi-bin/nw.cgi?inputs=8&algorithm=best&output=macro
  swap(arr, 0, 1);
  swap(arr, 2, 3);
  swap(arr, 0, 2);
  swap(arr, 1, 3);
  swap(arr, 1, 2);
  swap(arr, 4, 5);
  swap(arr, 6, 7);
  swap(arr, 4, 6);
  swap(arr, 5, 7);
  swap(arr, 5, 6);
  swap(arr, 0, 4);
  swap(arr, 1, 5);
  swap(arr, 1, 4);
  swap(arr, 2, 6);
  swap(arr, 3, 7);
  swap(arr, 3, 6);
  swap(arr, 2, 4);
  swap(arr, 3, 5);
  swap(arr, 3, 4);
}

export function convertDecToBase256(num: number): Vector4 {
  const divMod = n => [Math.floor(n / 256), n % 256];
  let tmp = num;
  // eslint-disable-next-line
  let r, g, b, a;

  [tmp, r] = divMod(tmp); // eslint-disable-line
  [tmp, g] = divMod(tmp); // eslint-disable-line
  [tmp, b] = divMod(tmp); // eslint-disable-line
  [tmp, a] = divMod(tmp); // eslint-disable-line

  // Big endian
  return [a, b, g, r];
}

export async function promiseAllWithErrors<T>(
  promises: Array<Promise<T>>,
): Promise<{ successes: Array<T>, errors: Array<Error> }> {
  const successOrErrorObjects = await Promise.all(promises.map(p => p.catch(error => error)));
  return successOrErrorObjects.reduce(
    ({ successes, errors }, successOrError) => {
      if (successOrError instanceof Error) {
        return {
          successes,
          errors: errors.concat([successOrError]),
        };
      } else {
        return {
          successes: successes.concat([successOrError]),
          errors,
        };
      }
    },
    { successes: [], errors: [] },
  );
}
