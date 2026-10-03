import assert from 'node:assert/strict'
import test from 'node:test'
import { getAuthenticatedStudentId, resolveStudentJobScope } from '../src/utils/studentAccess.ts'

test('only a valid server-side student session produces an authenticated id', () => {
  assert.equal(getAuthenticatedStudentId(null), null)
  assert.equal(getAuthenticatedStudentId({}), null)
  assert.equal(getAuthenticatedStudentId({ id: 'student-controlled-query-value' }), null)
  assert.equal(getAuthenticatedStudentId({ id: 0 }), null)
  assert.equal(getAuthenticatedStudentId({ id: 12 }), 12)
})

test('public job listings remain public even for signed-in students', () => {
  assert.equal(resolveStudentJobScope(null, false), 'public')
  assert.equal(resolveStudentJobScope({ id: 12 }, false), 'public')
})

test('member job listings require a valid server-side student session', () => {
  assert.equal(resolveStudentJobScope(null, true), 'unauthorized')
  assert.equal(resolveStudentJobScope({ id: 'forged' }, true), 'unauthorized')
  assert.equal(resolveStudentJobScope({ id: 12 }, true), 'members')
})
