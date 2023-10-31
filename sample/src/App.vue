<!-- eslint-disable vue/attribute-hyphenation -->
<!--
 * @Author: lzc
 * @Date: 2023-03-07 11:21:21
 * @Description: 筛选控件/并带有插槽
 * 我的审批类型3，我的发起类型5，我的数据类型6
-->

<template>
  <!-- 用于所有搜索页面的整体框架结构 -->
  <div :class="styles.container">
    <template v-if="type">
      <template v-if="openSearch">
        <div :class="styles['search-popup']">
          <custom-searchbar v-model="keyWords" :placeholder="formType !== '106' ? '请输入关键字搜索' : `${$t('请输入物料编码，物料名称')}`"
            background="#F7F8FA" input-background="#fff" confirm-type="search" :button-text="$t('搜索')" :clearable="true"
            @search="changeSearch" @keyup.enter="changeSearch" @clear="clearKeyWords" style="padding:5px 8px">
            <template #leftin>
              <image :src="searchIcon" style="width: 14px; height: 14px" />
            </template>
          </custom-searchbar>
          <view :class="styles.cacel" @click="lossSearch">{{ $t('取消') }}</view>
        </div>
      </template>
      <!-- 高级搜索组件 -->
      <view v-if="type === '1'" :class="styles.row">
        <!-- 暂不使用 -->
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <MutiSelectMenu :title="$t('资产状态')" v-model="assetStatus" :datalist="assetStatusList"
              :close-on-click-overlay="true" @confirm="assetStatusHandler" />
          </view>
          <view :class="styles['row-title']">
            <DateTimeField :title="$t('日期')" :type="DatePickType.YYMM" @confirmDate="confirmDate" />
          </view>
        </view>
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <IconFont :class="styles.icon" name="category" />
          </view>
          <view :class="styles['row-title']">
            |
          </view>
          <view :class="styles['row-title']" @click="doKeySearch">
            <div class="title">
              {{ $t('搜索') }}
            </div>
            <image :class="styles.icon" :src="searchIcon" />
          </view>
        </view>
      </view>
      <view v-if="type === '2'" :class="styles.row">
        <!-- 耗材采购查看数据筛选列表 -->
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <SimpleSelectMenu ref="sortTypeRef" :title="$t('默认排序')" v-model="sortStatus" :datalist="sortList"
              :self-top="MagicNumber.FIRTY" :close-on-click-overlay="true" @confirm="sortHandler"
              @onToggleExpand="onSelectMenuToggleExpand(1)" />
          </view>
          <view :class="styles['row-title']">
            <MutiSelectMenu ref="billTypeRef" :title="$t('单据状态')" v-model="billStatus" :datalist="statusList"
              :self-top="MagicNumber.FIRTY" :close-on-click-overlay="true" @confirm="statusHandler"
              @onToggleExpand="onSelectMenuToggleExpand(2)" />
          </view>
        </view>
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <Filiter ref="filterRef" :fields="fieldConfigArr" @confirm="filiterHandler" />
          </view>
          <view :class="styles['row-title']">
            |
          </view>
          <view :class="styles['row-title']" @click="doKeySearch">
            <div class="title">
              {{ $t('搜索') }}
            </div>
            <image :class="styles.icon" :src="searchIcon" />
          </view>
        </view>
      </view>
      <view v-if="type === '3'" :class="styles.row">
        <!-- 这是我的审批的请求列表组件 -->
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <MutiSelectMenu ref="billTypeRef" :title="$t('单据类型')" v-model="billType" :selfTop="MagicNumber.NINETYSIX"
              :datalist="billTypeList" :close-on-click-overlay="true" @confirm="billTypeHandler"
              @inform="closeOtherCom" />
          </view>
          <view :class="styles['row-title']">
            <DateTimeField ref="receiptTimeRef" :title="$t('接收时间')" @confirmDate="confirmDate" @inform="closeOtherCom"
              :showReset="true" />
          </view>
        </view>
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <div>|</div>
          </view>
          <view :class="styles['row-title']" @click="doKeySearch">
            <div class="title">
              {{ $t('搜索') }}
            </div>
            <image :class="styles.icon" :src="searchIcon" />
          </view>
        </view>
      </view>
      <view v-if="type === '4'" :class="styles.row">
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <MutiSelectMenu ref="billTypeRef" :title="$t('资产状态')" v-model="assetStatus" :datalist="assetStatusList"
              :close-on-click-overlay="true" @inform="closeOtherCom" />
            <view :class="styles['row-title']">
              <DateTimeField ref="receiptTimeRef" :title="$t('接收时间')" @confirmDate="confirmDate" @inform="closeOtherCom"
                :showReset="true" />
            </view>
          </view>
        </view>
        <view :class="styles['row-group']">
          <view :class="styles['row-title']" @click="doKeySearch">
            <div>|</div>
            <div class="title">
              {{ $t('搜索') }}
            </div>
            <image :class="styles.icon" :src="searchIcon" />
          </view>
        </view>
      </view>
      <view v-if="type === '5'" :class="styles.row">
        <!-- 我的发起/我的申请列表请求筛选 -->
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <MutiSelectMenu ref="billTypeRef" :title="$t('单据类型')" v-model="billType" :selfTop="MagicNumber.FIRTY"
              :close-on-click-overlay="true" :datalist="billTypeList" @confirm="billTypeHandler"
              @onToggleExpand="onSelectMenuToggleExpand(2)" @inform="closeOtherCom" />
            <view :class="styles['row-title']">
              <DateTimeField ref="receiptTimeRef" :title="$t('接收时间')" @confirmDate="confirmDate" @inform="closeOtherCom"
                :showReset="true" />
            </view>
            <MutiSelectMenu ref="approveStateRef" :title="$t('审批状态')" v-model="approveStatus" :selfTop="MagicNumber.FIRTY"
              :close-on-click-overlay="true" :datalist="approveStateList" @confirm="approvelStateHandler"
              @onToggleExpand="onSelectMenuToggleExpand(3)" @inform="closeOtherCom" />
          </view>
        </view>
      </view>
      <view v-if="type === '6'" :class="styles.row">
        <!-- 管理端许多单据的查看数据筛选框 -->
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <MutiSelectMenu ref="billTypeRef" :title="$t('单据状态')" v-model="billStatus" :datalist="statusList" :self-top="50"
              :close-on-click-overlay="true" @confirm="statusHandler" @inform="closeOtherCom" />
          </view>
          <view :class="styles['row-title']">
            <DateTimeField ref="receiptTimeRef" :title="$t('创建时间')" :showReset="true" @confirmDate="confirmDate"
              @inform="closeOtherCom" />
          </view>
        </view>
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <Filiter ref="filterRef" :fields="fieldConfigArr" @confirm="filiterHandler" />
          </view>
          <view :class="styles['row-title']" @click="doKeySearch">
            <div>|</div>
            <div class="title">
              {{ $t('搜索') }}
            </div>
            <image :class="styles.icon" :src="searchIcon" />
          </view>
        </view>
      </view>
      <view v-if="type === '7'" :class="styles.row">
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <slot name="7SearchLeft" />
          </view>
        </view>
        <view :class="styles['row-group']">
          <view :class="styles['row-title']" @click="doKeySearch">
            <div>|</div>
            <div class="title">
              {{ $t('搜索') }}
            </div>
            <image :class="styles.icon" :src="searchIcon" />
          </view>
        </view>
      </view>
      <view v-if="type === '8'" :class="styles.row">
        <!-- 这是我的签字列表请求列表组件 -->
        <view :class="styles['row-group']">
          <view :class="styles['row-title']">
            <MutiSelectMenu ref="billTypeRef" :title="$t('单据类型')" :model-value="billType" :datalist="billTypeList"
              :close-on-click-overlay="true" :selfTop="MagicNumber.NINETYSIX" @confirm="billTypeHandler" />
          </view>
          <view :class="styles['row-title']">
            <DateTimeField ref="receiptTimeRef" :title="$t('接收时间')" @confirmDate="confirmDate" :showReset="true" />
          </view>
        </view>
      </view>
    </template>
    <template v-else>
      <slot name="filiter" />
    </template>
  </div>
</template>

<script setup lang="ts">
import i18next from 'i18next';
const $t = i18next.t;


import { IconFont } from '@nutui/icons-vue-taro';
import { onMounted, ref, toRefs } from 'vue';
import SimpleSelectMenu from '@/components/base/simple-custom-select-menu/index.vue';
import MutiSelectMenu from '@/components/base/muti-custom-select-menu/index.vue';
import Filiter from '@/components/business/filter-popup/index.vue';
import { DatePickType } from '@/components/form/constant';
import { getEnumInfo, getSearchDisplayColumns } from '@/services/order.service';
import styles from './index.module.scss';
import { getApprovalStatusV2, getApprovalType, queryAllSignType } from '@/services/approval.service';
import { imageBaseUrl } from '@/services/util.service';
import { MagicNumber } from '@/type/common.enum'
import fieldConfMap from './conf/index'; // 高级筛选的自定义配置

</script>
