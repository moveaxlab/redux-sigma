import { not } from '../guards';

function someCondition(a: number, b: number) {
  return a > b;
}

it('tests the not function', () => {
  const negatedCondition = not(someCondition);

  expect(someCondition(4, 5)).toBeFalse();

  expect(negatedCondition(4, 5)).toBeTrue();

  expect(someCondition(5, 4)).toBeTrue();

  expect(negatedCondition(5, 4)).toBeFalse();
});
