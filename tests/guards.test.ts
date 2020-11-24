import { and, not, or } from '../src';

function firstGreaterThanSecond(a: number, b: number): boolean {
  return a > b;
}

function greaterThanFive(a: number): boolean {
  return a > 5;
}

function lessThanTen(a: number): boolean {
  return a < 10;
}

function greaterThanTwenty(a: number): boolean {
  return a > 20;
}

describe('Test guard utilities', () => {
  expect(firstGreaterThanSecond(4, 5)).toBeFalse();
  expect(firstGreaterThanSecond(5, 4)).toBeTrue();

  expect(greaterThanFive(4)).toBeFalse();
  expect(greaterThanFive(6)).toBeTrue();

  expect(lessThanTen(9)).toBeTrue();
  expect(lessThanTen(11)).toBeFalse();

  expect(greaterThanTwenty(10)).toBeFalse();
  expect(greaterThanTwenty(30)).toBeTrue();

  test('not utility works', () => {
    const secondGreaterThanFirst = not(firstGreaterThanSecond);

    expect(secondGreaterThanFirst(4, 5)).toBeTrue();

    expect(secondGreaterThanFirst(5, 4)).toBeFalse();
  });

  test('and utility works', () => {
    const betweenFiveAndTen = and(greaterThanFive, lessThanTen);

    expect(betweenFiveAndTen(6)).toBeTrue();
    expect(betweenFiveAndTen(11)).toBeFalse();
    expect(betweenFiveAndTen(3)).toBeFalse();
  });

  test('or utility works', () => {
    const lessThanTenOrMoreThanTwenty = or(lessThanTen, greaterThanTwenty);

    expect(lessThanTenOrMoreThanTwenty(5)).toBeTrue();
    expect(lessThanTenOrMoreThanTwenty(15)).toBeFalse();
    expect(lessThanTenOrMoreThanTwenty(30)).toBeTrue();
  });
});
