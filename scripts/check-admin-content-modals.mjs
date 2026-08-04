import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../public/static/admin.js', import.meta.url), 'utf8')

function createClassList(initial = []) {
  const classes = new Set(initial)
  return {
    add: (...values) => values.forEach(value => classes.add(value)),
    remove: (...values) => values.forEach(value => classes.delete(value)),
    contains: value => classes.has(value)
  }
}

const modal = {
  classList: createClassList(['hidden']),
  addEventListener() {}
}
const modalContent = { innerHTML: '' }
const alerts = []

const api = {
  async get(path) {
    if (path === '/homepage/success-stories/admin') {
      return {
        data: {
          data: [{
            id: 7,
            student_name: 'テスト <学生>',
            university: 'テスト大学',
            company_name: 'テスト企業',
            comment: '<script>invalid</script>',
            is_visible: 1,
            display_order: 2
          }]
        }
      }
    }
    if (path === '/homepage/university-tags/admin') {
      return {
        data: {
          data: [{
            id: 9,
            name: 'テスト & 大学',
            slug: 'test-university',
            description: '<b>説明</b>',
            is_visible: 0,
            display_order: 3
          }]
        }
      }
    }
    throw new Error(`Unexpected GET ${path}`)
  },
  async post() {},
  async put() {},
  async delete() {}
}

const context = vm.createContext({
  axios: { create: () => api },
  document: {
    getElementById(id) {
      if (id === 'modal') return modal
      if (id === 'modal-content') return modalContent
      return null
    },
    querySelectorAll: () => []
  },
  window: { addEventListener() {}, location: { reload() {} } },
  alert: message => alerts.push(String(message)),
  confirm: () => true,
  console,
  setTimeout,
  clearTimeout,
  FormData: class FormData {}
})

vm.runInContext(source, context)

async function run(expression) {
  return vm.runInContext(expression, context)
}

function resetModal() {
  modal.classList.add('hidden')
  modalContent.innerHTML = ''
}

await run('showSuccessStoryModal()')
assert.equal(modal.classList.contains('hidden'), false, '内定者タイムライン追加モーダルが表示されること')
assert.match(modalContent.innerHTML, /submitCreateSuccessStory\(event\)/)
assert.match(modalContent.innerHTML, /内定者タイムライン追加/)
await run('closeModal()')
assert.equal(modal.classList.contains('hidden'), true, '内定者タイムラインモーダルを閉じられること')

resetModal()
await run("showSuccessStoryModal('7')")
assert.equal(modal.classList.contains('hidden'), false, '内定者タイムライン編集モーダルが表示されること')
assert.match(modalContent.innerHTML, /submitUpdateSuccessStory\(event, 7\)/)
assert.match(modalContent.innerHTML, /テスト &lt;学生&gt;/, '内定者データがHTMLエスケープされること')
assert.doesNotMatch(modalContent.innerHTML, /<script>/)

resetModal()
await run('showUniversityTagModal()')
assert.equal(modal.classList.contains('hidden'), false, '大学タグ追加モーダルが表示されること')
assert.match(modalContent.innerHTML, /submitCreateUniversityTag\(event\)/)
assert.match(modalContent.innerHTML, /大学タグ追加/)
await run('closeModal()')
assert.equal(modal.classList.contains('hidden'), true, '大学タグモーダルを閉じられること')

resetModal()
await run("showUniversityTagModal('9')")
assert.equal(modal.classList.contains('hidden'), false, '大学タグ編集モーダルが表示されること')
assert.match(modalContent.innerHTML, /submitUpdateUniversityTag\(event, 9\)/)
assert.match(modalContent.innerHTML, /テスト &amp; 大学/, '大学タグがHTMLエスケープされること')
assert.doesNotMatch(modalContent.innerHTML, /<b>説明<\/b>/)

assert.deepEqual(alerts, [], `予期しないアラート: ${alerts.join(', ')}`)
console.log('Admin content modal checks passed')
