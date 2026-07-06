import request from '@/config/axios'

const demoDictList: DictDataVO[] = [
  {
    label: '正常',
    value: '0',
    dictType: 'common_status',
    status: 0,
    colorType: 'success',
    cssClass: '',
    remark: '本地演示'
  },
  {
    label: '禁用',
    value: '1',
    dictType: 'common_status',
    status: 0,
    colorType: 'danger',
    cssClass: '',
    remark: '本地演示'
  },
  {
    label: '待审核',
    value: 'pending',
    dictType: 'skit_review_status',
    status: 0,
    colorType: 'warning',
    cssClass: '',
    remark: '本地演示'
  }
]

export interface DictDataVO {
  id?: number
  sort?: number
  label: string
  value: string
  dictType: string
  status: number
  colorType: string
  cssClass: string
  remark: string
  createTime?: Date
}

// 查询字典数据（精简)列表
export const getSimpleDictDataList = () => {
  if (import.meta.env.VITE_SKIT_DEMO_LOGIN === 'true') {
    return Promise.resolve(demoDictList)
  }
  return request.get({ url: '/system/dict-data/simple-list' })
}

// 查询字典数据列表
export const getDictDataPage = (params: PageParam) => {
  return request.get({ url: '/system/dict-data/page', params })
}

// 查询字典数据详情
export const getDictData = (id: number) => {
  return request.get({ url: '/system/dict-data/get?id=' + id })
}

// 根据字典类型查询字典数据
export const getDictDataByType = (dictType: string) => {
  return request.get({ url: '/system/dict-data/type?type=' + dictType })
}

// 新增字典数据
export const createDictData = (data: DictDataVO) => {
  return request.post({ url: '/system/dict-data/create', data })
}

// 修改字典数据
export const updateDictData = (data: DictDataVO) => {
  return request.put({ url: '/system/dict-data/update', data })
}

// 删除字典数据
export const deleteDictData = (id: number) => {
  return request.delete({ url: '/system/dict-data/delete?id=' + id })
}

// 批量删除字典数据
export const deleteDictDataList = (ids: number[]) => {
  return request.delete({ url: '/system/dict-data/delete-list', params: { ids: ids.join(',') } })
}

// 导出字典数据
export const exportDictData = (params: any) => {
  return request.download({ url: '/system/dict-data/export-excel', params })
}
