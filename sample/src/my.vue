<template>
  <nut-popup
    v-model:visible="visible"
    position="bottom"
    round
    pop-class="doubt-modal"
    :style="{ height: '85%' }"
  >
    <div class="doubt-content-wrapper">
      <div class="header">
        <div class="header-left" @click="handleClose">
          <div class="close-icon">
            <span class="close-icon-text">×</span>
          </div>
        </div>
        <div class="header-middle">
          {{ $t('存疑备注') }}
        </div>
        <div class="header-right" />
      </div>
      <div class="content">
        <div class="content-item">
          {{ $t('存疑标签') }}
        </div>
        <nut-checkbox-group v-model="formData.questionLabelIds">
          <div v-for="item in doubtList" :key="item.id" class="content-item">
            <div class="content-item-left">
              {{ item.value }}
            </div>
            <div class="content-item-right">
              <nut-checkbox :label="item.id" />
            </div>
          </div>
        </nut-checkbox-group>
        <div class="content-item textarea-wrapper">
          <div class="content-item-left">
            {{ $t('备注') }}
          </div>
          <div class="content-item-right textarea">
            <textarea-field v-model="formData.questionRemark" limit-show max-length="200" :placeholder="$t('请输入备注')" />
          </div>
        </div>
      </div>
      <div class="footer" @click="handleConfirm">
        <nut-button type="primary" block>
          {{ $t('确认') }}
        </nut-button>
      </div>
    </div>
  </nut-popup>
</template>

<script lang="ts" setup>
  import { getInventoryQuestionList } from '@/services/inventory.service';
  import { toRefs, computed, ref, onMounted } from 'vue'
  import i18next from 'i18next';
  const $t = i18next.t;
  
  interface Props {
    modelValue: boolean,
  }

  interface FormData {
    questionLabelIds: number[],
    questionRemark: string
  }

  interface Emit {
    (event: 'update:modelValue', val: boolean ): void;
    (event: 'confirm', val: FormData ): void;
  }

  const emitter = defineEmits<Emit>();
  const props = defineProps<Props>();
  const { modelValue } = toRefs(props);
  const visible = computed({
    get() {
      return modelValue.value
    },
    set(val) {
      emitter('update:modelValue', val)
    }
  })
  const doubtList = ref([])
  const formData = ref<FormData>({
    questionLabelIds: [],
    questionRemark: ''
  })

  const handleClose = () => {
    formData.value = {
      questionLabelIds: [],
      questionRemark: ''
    }
    visible.value = false
  }

  const handleConfirm = () => {
    emitter('confirm', formData.value)
    handleClose()
  }

  onMounted(async () => {
    try {
      doubtList.value = await getInventoryQuestionList()
    } catch(e) {
      console.error(e)
    }
  })
</script>

<style lang="scss">
  .doubt-modal {
    .doubt-content-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding: 0 15px 34px;
      background-color: #F7F8FA;
      .header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        line-height: 48px;
        font-size: 14px;
        .header-left {
          .close-icon {
            width: 20px;
            height: 20px;
            line-height: 20px;
            text-align: center;
            border-radius: 50%;
            color: #fff;
            background-color: #C8C9CC;
            .close-icon-text {
              position: relative;
              bottom: 1px;
            }
          }
        }
        .header-middle {
          font-size: 16px;
          font-weight: 500;
          color: #323233;
        }
        .header-right {
          color: #00B3B1;
        }
      }
      .content {
        width: 100%;
        flex-grow: 1;
        padding: 16px 12px;
        box-sizing: border-box;
        line-height: 20px;
        font-size: 14px;
        color: #323233;
        background: #fff;
        .content-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          .content-item-left {
            width: 78px;
            color: #646566;
          }
          .textarea {
            flex-grow: 1;
          }
        }
        .textarea-wrapper {
          align-items: flex-start;
          .textarea {
            .nut-textarea__textarea {
              min-height: 100px;
            }
          }
        }
      }
      .footer {
        margin-top: 8px;
      }
    }
  }
</style>
