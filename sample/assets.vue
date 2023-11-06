<template>
  <DefaultLayout>
    <component
      :is="getCurPageComponent(formOrderType)"
      v-if="formOrderType && formOrderInstance"
      :form-order-instance="formOrderInstance"
      :sheet-id="sheetId"
      :purchase-sheet-status="purchaseSheetStatus"
      :submit-auth="submitAuth"
      :sheet-service="sheetService"
    />
  </DefaultLayout>
</template>
<script lang="ts" setup>
import Taro, { useLoad, useRouter } from '@tarojs/taro';
import { ref } from 'vue';
import { FormType } from '@/type/common.enum';
import { getAssetDetail, getLastOne } from '@/services/asset.service';
import { navigationBarTitleMap } from '@/pages/common/form-order/utils/config';
import { FormOrderMap, formConfigMap, pageMap } from './config';
import FormOrderClass from '@/core/model/FormOrder';
import { FormOrderParamsD, SheetInfo } from '@/core/interface';
import { setTitle } from '@/utils/common.util';
import { SheetServiceMap } from '@/core/configMap';

const formOrderInstance = ref<FormOrderClass>();
const formOrderType = ref<number>() as any;
const formAliasName = ref<string>(''); // 资产单据别名
const detailName = ref<string>(''); // 单据明细别名
// 只用在复制，编辑单据上
const sheetId = ref<string>(''); // 单据id
const purchaseSheetStatus = ref<string>('');
const submitAuth = ref<string>('1');
const getCurPageComponent = (formType: string) => {
  const type = Number(formType);
  return pageMap[type];
};

const { formType: formTypeStr } = useRouter().params;

const sheetService = SheetServiceMap[formTypeStr || ''];

/** 初始化资产表单整体结构 */
const getBillDefine = async () => {
  try {
    const params = {
      formType: formOrderType.value,
    };
    const res = await getLastOne(params);

    if (res) {
      if (formOrderType.value === FormType.REPAIR) {
        res.formContent.formDetailInfos.push({
          detailItems: [
            {
              formItemCode: 'materialCode',
              formFieldType: 'input',
              formFieldProperties: { label: '物料编码' },
              isChoosed: true,
            },
            {
              formItemCode: 'materialName',
              formFieldType: 'input',
              formFieldProperties: { label: '物料名称' },
              isChoosed: true,
            },
            {
              formItemCode: 'stockNum',
              formFieldType: 'input',
              formFieldProperties: { label: '当前库存' },
              isChoosed: true,
            },
            {
              formItemCode: 'materialNum',
              formFieldType: 'number',
              formFieldProperties: { label: '出库数量', required: true, precision: 2 },
              formItemRdType: 1,
              isChoosed: true,
            },
            {
              formItemCode: 'remark',
              formFieldType: 'input',
              formFieldProperties: { label: '出库物料备注' },
              formItemRdType: 1,
              isChoosed: true,
            },
            {
              formItemCode: 'categoryName',
              formFieldType: 'input',
              formFieldProperties: { label: '物料分类' },
              isChoosed: true,
            },
            { formItemCode: 'brand', formFieldType: 'input', formFieldProperties: { label: '品牌' }, isChoosed: true },
            {
              formItemCode: 'model',
              formFieldType: 'input',
              formFieldProperties: { label: '规格型号' },
              isChoosed: true,
            },
            {
              formItemCode: 'unit',
              formFieldType: 'input',
              formFieldProperties: { label: '库存单位' },
              isChoosed: true,
            },
          ],
          detailName: '耗材明细',
        });
      }
    }
    return res;
  } catch (e) {
    console.error(e);
  }
};

/** 初始化资产页面所需要的数据接口结构 */
const initFormOrderInstance = async (formType: string) => {
  Taro.showLoading()
  const formOrder = FormOrderMap[formOrderType.value];
  let customForm: SheetInfo;
  if (formOrder) {
    customForm = formOrder.customForm!;
  } else {
    customForm = await getBillDefine();
  }
  formAliasName.value = customForm.formAliasName!;
  detailName.value = customForm.formContent.formDetailInfos[0].detailName;
  const config = formConfigMap[Number(formOrderType.value)];
  switch (formType) {
    case FormType.TRANSFER: // 资产调拨
    case FormType.BORROW: // 资产借出/借用
    case FormType.DISPOSE: // 资产处置
    case FormType.DISTRIBUTE: // 资产派发
    case FormType.RECEIVE_RETURN: // 资产退库
    case FormType.BORROW_RETURN: // 资产归还
    case FormType.ASSET_CHANGE_USER: // 变更领用人
      formOrderInstance.value = new FormOrderClass(
        {
          formType: formOrderType.value,
          title: '资产',
          customForm: customForm,
          selectAssetPopupParams: {
            title: '资产',
            searchInputParams: {
              label: '资产',
              placeholder: '请输入关键字搜索',
            },
          },
          formOrderBottomParams: {
            title: detailName.value || '资产明细',
            detailPopupParams: {
              title: detailName.value || '资产明细',
              buttomTitle: '资产',
              isShowBatchFilling: true,
            },
          },
        } as FormOrderParamsD,
        config
      );
      break;
    case FormType.REPAIR: // 资产维修
      formOrderInstance.value = new FormOrderClass(
        {
          formType: formOrderType.value,
          title: '资产',
          customForm: customForm,
          selectAssetPopupParams: {
            title: '资产',
            searchInputParams: {
              label: '资产',
              placeholder: '请输入关键字搜索',
            },
          },
          selectMaterialPopupParams: {
            title: '耗材',
            searchInputParams: {
              label: '耗材',
              placeholder: '请输入关键字搜索',
              isShowAdvancedFilter: false,
            },
          },
          formOrderBottomParams: {
            title: detailName.value || '资产明细',
            detailPopupParams: {
              title: detailName.value || '资产明细',
              buttomTitle: '资产',
              isShowBatchFilling: true,
            },
          },
        } as FormOrderParamsD,
        config
      );
      break;
    case FormType.ASSET_PURCHASE: // 资产采购
      formOrderInstance.value = new FormOrderClass(
        {
          formType: formOrderType.value,
          title: '资产',
          customForm: customForm,
          selectStandardPopupParams: {
            title: '标准品',
            searchInputParams: {
              label: '标准品',
              placeholder: '请输入关键字搜索',
            },
          },
          formOrderBottomParams: {
            title: detailName.value || '资产明细',
            assetDetailPopupParams: {
              isShowBatchFilling: true,
            },
            detailPopupParams: {
              showViewDetail: false,
            },
          },
        } as FormOrderParamsD,
        config
      );
      break;
    case FormType.CONSUME_PURCHASE:
      formOrderInstance.value = new FormOrderClass(
        {
          formType: formOrderType.value,
          title: '耗材',
          customForm: customForm,
          selectMaterialPopupParams: {
            title: '耗材',
            searchInputParams: {
              label: '耗材',
              placeholder: '请输入关键字搜索',
            },
          },
          formOrderBottomParams: {
            title: detailName.value || '耗材明细',
            detailPopupParams: {
              title: detailName.value || '耗材明细',
              buttomTitle: '耗材',
              isShowBatchFilling: true,
            },
          },
        } as FormOrderParamsD,
        config
      );
      break;
    case FormType.ASSETS_CHECK:
      formOrderInstance.value = new FormOrderClass(formOrder, config);
      break;
    default:
      formOrderInstance.value = {} as FormOrderClass;
  }
  Taro.hideLoading()
};

/** 初始化页面title */
const initTitle = (formType: string, formAliasName: string) => {
  setTitle(formAliasName || navigationBarTitleMap[formType]);
};

const initFormType = (formType: string) => {
  formOrderType.value = formType;
};

const initData = async (formType: string) => {
  initFormType(formType);
  await initFormOrderInstance(formType);
  initTitle(formType, formAliasName.value);
};

const addAssetsCard = assetsCardData => {
  formOrderInstance.value?.addDetailCard([...assetsCardData]);
};

/** 页面初始化 */
useLoad(async options => {
  if (options.sheetId) {
    // 暂存需要请求数据
    sheetId.value = options.sheetId;
  }
  if (options.purchaseSheetStatus) {
    purchaseSheetStatus.value = options.purchaseSheetStatus;
  }
  if (options.submitAuth) {
    submitAuth.value = options.submitAuth;
  }

  const { formType } = options || {};
  await initData(formType);

  if (options.assetId) {
    const detail = await getAssetDetail({ assetCardId: options.assetId });
    addAssetsCard([detail]);
  }
});
</script>
