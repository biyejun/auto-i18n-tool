<template>
  <nut-button
    v-if="renderActionList.length && showManageButton"
    :class="$attrs.class"
    type="primary"
    @click="visible = true"
  >
    资产管理
  </nut-button>
  <template v-if="props.assetDetail">
    <BottomPopup v-model:visible="visible" title="资产管理">
      <Card v-if="assetDetail" :class="styles.manageCard">
        <view :class="styles.titleBar">
          <view>
            <AssetStatusTag :status="assetDetail.assetStatus" :text="assetDetail.assetStatusString" />
            <text :class="styles.title">
              {{ assetDetail.assetCode }}
            </text>
          </view>
          <view v-if="sendCardBtnVisible" :class="styles.sendCardBtn" @click="onSendCard">
            发卡
          </view>
        </view>
        <Descriptions :rows="displayRows" :data="assetDetail" />

        <view :class="styles.actionList">
          <view
            v-for="item in renderActionList"
            :key="item.id"
            :style="{ backgroundColor: item.color }"
            :class="styles.actonItem"
            @click="item.action"
          >
            <image :class="styles.icon" :src="item.icon" />
            <text :class="styles.actionTitle">
              {{ item.title }}
            </text>
          </view>
        </view>
      </Card>
    </BottomPopup>
    <AssetCopyPopup
      v-model:visible="dialogVisible"
      :asset-id="props.assetDetail!.id"
      @copy-success="handleCopySuccess"
    />
  </template>
</template>

<script lang="ts">
const RFIDStatus = {
  1: '未发卡',
  2: '已发卡',
}
const rows: RowOption[] = [
  {
    title: '资产名称',
    dataIndex: 'assetName',
  },
  {
    title: '使用状况',
    dataIndex: 'deviceStatusString',
    component: DeviceUseStatus,
  },
  {
    title: 'RFID',
    dataIndex: 'rfidCode',
  }, {
    title: '发卡状态',
    dataIndex: 'rfidStatus',
    component: p => h('span', {}, RFIDStatus[p.rfidStatus] || '-')
  }
];
</script>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
import styles from './index.module.scss';
import AssetCopyPopup from '../asset-copy-popup/index.vue';
import { RowOption } from '@/components/base/descriptions/index.vue';
import { navigationBack, navigationPush } from '@/utils/router.util';
import { AssetFormType, FormType } from '@/type/common.enum';
import { deleteAssetCard, updateAssetCardRfidStatus } from '@/services/asset.service';
import { assetPrinter, getDeviceBrand, writeRFID } from '@/utils/jsb.util';
import { isApp } from '@/utils/env.util';
import { isManageClient, showDialog, showToast } from '@/utils/common.util';
import { notPrivateUseStatusMap, privateUseStatusMap, selfStatusActionMap, statusActionMap } from '../../constant';
import AuthCollection, { checkAuth } from '@/utils/auth.util';
import { getCompanyUserOperationConfigV2, getLastAliasNameForMenu } from '@/services/common.service';
import { intersection } from 'lodash';
import { UseStatusEnum } from '@/core/constant';
import DeviceUseStatus from '@/components/business/device-use-status/index.vue';
import { imageBaseUrl } from '@/services/util.service';
import { ClientTypeEnum, useSystem } from '@/stores/system';

/** 获取是否自动编码 */

interface Props {
  assetDetail?: Record<string, any>;
  visible?: boolean;
  /** 在资产列表还是资产详情调用list-资产列表，detail-资产详情 */
  pageType: 'list' | 'detail';
  /**  是否展示组件内的资产管理按钮 */
  showManageButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showManageButton: true,
  visible: undefined,
});

const emit = defineEmits(['update:visible', 'refresh']);

const visibleRef = ref(false);
const sendCardBtnVisible = ref(false)

const systemInfo = useSystem();

// 允许visible受控
const visible = computed({
  get: () => props.visible ?? visibleRef.value,
  set: visible => {
    visibleRef.value = visible;
    emit('update:visible', visible);
  },
});

const displayRows = computed(() => {
  if (isManageClient()) {
    return rows;
  }
  return [
    {
      title: '资产分类',
      dataIndex: 'categoryName',
    },
  ];
});

const dialogVisible = ref(false);

// 员工端权限列表
const selfAuthList = ref<number[]>([]);
// 单据别名
const aliasNameList = ref<any[]>([]);

// 跳转资产编辑
const handleEdit = () => {
  navigationPush(`/pages/common/asset/asset-add/index?id=${props.assetDetail!.id}`);
};

// 跳转表单发起
const jumpForm = (formType: AssetFormType) => {
  navigationPush(`/pages/manage/form-order/assets/assets?formType=${formType}&assetId=${props.assetDetail!.id}`);
};

// 跳转员工端表单发起
const jumpSelfForm = (formType: string) => {
  const folder = Object.values(AssetFormType).includes(formType as any) ? 'assets' : 'material';
  navigationPush(
    `/pages/employee/form-order/${folder}/${folder}?formType=${formType}&assetId=${props.assetDetail!.id}`
  );
};

const handlePrint = () => {
  assetPrinter({ list: [props.assetDetail!.id] });
};

const handleDelete = () => {
  showDialog({
    title: '删除提示',
    content: '删除资产将无法找回，是否继续？',
  }).then(() => {
    deleteAssetCard({
      assetCardId: props.assetDetail!.id,
    }).then(() => {
      showToast('删除成功');
      // 在详情页，返回上一页
      if (props.pageType === 'detail') {
        navigationBack();
      } else {
        // 在列表页，刷新列表
        visible.value = false;
        emit('refresh');
      }
    });
  });
};

const AssetListAuthList = AuthCollection.Asset.List;

const originManageActionList = [
  {
    title: '编辑',
    id: '编辑',
    color: '#FEFAF1',
    icon: imageBaseUrl + '/picture/manage-popup/edit.webp',
    auth: AssetListAuthList.Edit,
    action: handleEdit,
  },
  {
    title: '派发',
    id: '派发',
    color: '#EFF9F8',
    auth: AssetListAuthList.Distribute,
    icon: imageBaseUrl + '/picture/manage-popup/distribute.webp',
    action: () => jumpForm(FormType.DISTRIBUTE),
  },
  {
    title: '借出',
    id: '借出',
    color: '#F2F6FF',
    icon: imageBaseUrl + '/picture/manage-popup/borrow.webp',
    auth: AssetListAuthList.Borrow,
    action: () => jumpForm(FormType.BORROW),
  },
  {
    title: '调拨',
    id: '调拨',
    color: '#FDF5F3',
    icon: imageBaseUrl + '/picture/manage-popup/allot.webp',
    auth: AssetListAuthList.Transfer,
    action: () => jumpForm(FormType.TRANSFER),
  },
  {
    title: '维修',
    id: '维修',
    color: '#FEFAEF',
    icon: imageBaseUrl + '/picture/manage-popup/repair.webp',
    auth: AssetListAuthList.Repair,
    action: () => jumpForm(FormType.REPAIR),
  },
  {
    title: '处置',
    id: '处置',
    color: '#F4F2FF',
    icon: imageBaseUrl + '/picture/manage-popup/dispose.webp',
    auth: AssetListAuthList.Dispose,
    action: () => jumpForm(FormType.DISPOSE),
  },
  {
    title: '删除',
    id: '删除',
    color: '#F2FCFE',
    icon: imageBaseUrl + '/picture/manage-popup/delete.webp',
    auth: AssetListAuthList.Delete,
    action: handleDelete,
  },
  {
    title: '复制',
    id: '复制',
    color: '#F4F1FF',
    icon: imageBaseUrl + '/picture/manage-popup/copy.webp',
    auth: AssetListAuthList.Copy,
    action: () => {
      dialogVisible.value = true;
    },
  },
  {
    title: '退库',
    id: '退库',
    color: '#F4F1FF',
    icon: imageBaseUrl + '/picture/manage-popup/refund.webp',
    auth: AssetListAuthList.RefundStock,
    action: () => jumpForm(FormType.RECEIVE_RETURN),
  },
  {
    title: '变更领用人',
    id: '变更领用人',
    color: '#F4F1FF',
    icon: imageBaseUrl + '/picture/manage-popup/changeUser.webp',
    auth: AssetListAuthList.ChangeReceiver,
    action: () => jumpForm(FormType.ASSET_CHANGE_USER),
  },
  {
    hide: !isApp(),
    title: '打印',
    id: '打印',
    color: '#EFF9F8',
    icon: imageBaseUrl + '/picture/manage-popup/print.webp',
    auth: AssetListAuthList.Print.PrintCode,
    action: () => handlePrint(),
  },
  {
    title: '归还',
    id: '归还',
    color: '#F4F1FF',
    icon: imageBaseUrl + '/picture/manage-popup/return.webp',
    auth: AssetListAuthList.Return,
    action: () => jumpForm(FormType.BORROW_RETURN),
  },
  {
    title: '资产验收',
    id: '资产验收',
    color: '#FDF5F3',
    icon: imageBaseUrl + '/picture/manage-popup/check.webp',
    auth: AssetListAuthList.Check,
    action: () => jumpForm(FormType.ASSETS_CHECK),
  },
];

const originEmployeeActionList = [
  {
    icon: imageBaseUrl + '/picture/manage-popup/config.webp',
    id: '自助领用资产',
    title: '自助领用资产',
    color: '#FEFAF1',
    auth: 106,
    action: () => jumpSelfForm(AssetFormType.SELF_SCAN_RECEIVE),
  },
  {
    icon: imageBaseUrl + '/picture/manage-popup/config.webp',
    id: '自助借用资产',
    title: '自助借用资产',
    color: '#EFF9F8',
    auth: 153,
    action: () => jumpSelfForm(AssetFormType.SELF_ASSET_BORROW),
  },
  {
    icon: imageBaseUrl + '/picture/manage-popup/repair.webp',
    id: '报修资产',
    title: '报修资产',
    color: '#F2F6FF',
    auth: [157, 251],
    action: () => jumpSelfForm(AssetFormType.SELF_REPAIR),
  },
  {
    icon: imageBaseUrl + '/picture/manage-popup/allot.webp',
    id: '交接资产',
    title: '交接资产',
    color: '#FDF5F3',
    auth: 107,
    action: () => jumpSelfForm(AssetFormType.SELF_HAND_OVER),
  },
  {
    icon: imageBaseUrl + '/picture/manage-popup/return.webp',
    id: '退还资产',
    title: '退还资产',
    color: '#FEFAEF',
    auth: 155,
    action: () => jumpSelfForm(AssetFormType.SELF_RECEIVE_RETURN),
  },
];

const manageActionList = computed(() => {
  if (!props.assetDetail) {
    return [];
  }
  return originManageActionList.filter(item => {
    if (item.hide || !checkAuth(item.auth)) {
      return false;
    }
    let currentStatusMap = statusActionMap[props.assetDetail!.assetStatus];
    // 没有找到当前状态对应的操作，使用默认操作
    if (!currentStatusMap) {
      currentStatusMap = statusActionMap.default;
    }
    // 通过使用状态找到可执行的操作
    const acitonIds: string[] = currentStatusMap[props.assetDetail!.deviceStatus];

    return acitonIds.includes(item.title);
  });
});

/**
 * 是否为当前用户名下资产
 */
const isPrivateUse = computed(() => {
  if (!props.assetDetail) {
    return '';
  }
  return props.assetDetail.isPrivateUse;
});

const employeeActionList = computed(() => {
  if (!props.assetDetail) {
    return [];
  }
  let actionList = selfStatusActionMap[props.assetDetail.assetStatus];
  let resultList = originEmployeeActionList;
  // 只对领用、借用、空闲筛选状态
  if (actionList) {
    // 先根据状态筛一次
    resultList = originEmployeeActionList.filter(item => actionList.includes(item.id));
  }
  // 再根据权限筛一次

  resultList = resultList.filter(item => {
    if (Array.isArray(item.auth)) {
      return intersection(item.auth, selfAuthList.value).length > 0;
    }
    return selfAuthList.value.includes(item.auth);
  });

  let statusMap = {};
  // 非本人名下资产
  if (isPrivateUse.value !== '' && Number(isPrivateUse.value) === 0) {
    statusMap = notPrivateUseStatusMap;
    // 不是自己名下资产，去掉报修资产按钮
    if (!selfAuthList.value.includes(251)) {
      resultList = resultList.filter(item => item.id !== '报修资产');
    }
  } else {
    statusMap = privateUseStatusMap;
    // 自己名下的资产，如果全员报修与个人保修都没有开启，去掉报修按钮
    if (!selfAuthList.value.includes(251) && !selfAuthList.value.includes(157)) {
      resultList = resultList.filter(item => item.id !== '报修资产');
    }
  }

  if (props.assetDetail.deviceStatus === UseStatusEnum.IN_REPAIR) {
    resultList = resultList.filter(item => item.id !== '报修资产');
  }
  let privateActionList = statusMap[props.assetDetail.assetStatus];

  privateActionList = privateActionList ? privateActionList[props.assetDetail.deviceStatus] : [];
  resultList = resultList.filter(item => privateActionList.includes(item.id));

  // 添加别名
  resultList.forEach(item => {
    const aliasItem = aliasNameList.value.find(menuItem => item.id === menuItem.formName);
    if (aliasItem && aliasItem.formAliasName) {
      item.title = aliasItem.formAliasName;
    }
  });

  return resultList;
});

const renderActionList = computed(() => {
  return isManageClient() ? manageActionList.value : employeeActionList.value;
});

/**
 * 资产复制成功
 */
const handleCopySuccess = () => {
  visible.value = false;
  if (props.pageType === 'detail') {
    navigationBack();
  } else {
    emit('refresh');
  }
};

const onSendCard = () => {
  try {
    getDeviceBrand(data => {
      if (data?.type === 1) {
        if (props.assetDetail?.rfidCode) {
          writeRFID({ id: props.assetDetail.rfidCode }, async val => {
            val?.result && props.assetDetail && await updateAssetCardRfidStatus({ ids: props.assetDetail.id, rfidStatus: 2 })
            showToast(val?.result ? '发卡成功' : '发卡失败，请重试')
            visible.value = false;
            emit('refresh');
          })
        } else {
          showToast('该资产暂无RFID数据，请先生成RFID数据')
        }
      } else {
        showToast('请连接设备')
      }
    })
  } catch (error) {
    showToast('请连接设备')
  }
}

watch(visible, () => {
  if (props.assetDetail?.assetStatus !== 90 && visible.value && isApp() && systemInfo.clientType === ClientTypeEnum.MANAGE) {
    getDeviceBrand(data => {
      sendCardBtnVisible.value = data?.type === 1 // 信达设备
    })
  } else {
    sendCardBtnVisible.value = false
  }
})

onMounted(() => {
  if (isManageClient()) {
    return;
  }
  getLastAliasNameForMenu().then(menuList => {
    aliasNameList.value = menuList || [];
  });
  getCompanyUserOperationConfigV2().then(config => {
    selfAuthList.value = config.userOperationTypeList || [];
  });
});
</script>
