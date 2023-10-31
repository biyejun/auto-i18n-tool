
import { useI18n } from 'vue-i18n';
const $t = useI18n().t;

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

// 4f401e行注释

console.log($t('你好'))

const template = $t('main.4ef2da')

console.log(`${$t('main.这是')}${template}end` + $t('main.7eca68') + 'hello')

const template2 = `${$t('main.5a50de')}`

document.querySelector('body').innerHTML = template2;

/**
 * 这是DOC注释
 */