<script setup>
import { useInfiniteScroll } from '@vueuse/core'
import { Loader } from 'lucide-vue-next'

const links = ref([])
const limit = 24
let cursor = ''
let listComplete = false
let listError = false

const sortBy = ref('az')
const selectedLinks = ref([])

const displayedLinks = computed(() => {
  const sorted = [...links.value]
  switch (sortBy.value) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt)
    case 'az':
      return sorted.sort((a, b) => a.slug.localeCompare(b.slug))
    case 'za':
      return sorted.sort((a, b) => b.slug.localeCompare(a.slug))
    default:
      return sorted
  }
})

async function getLinks() {
  try {
    const data = await useAPI('/api/link/list', {
      query: {
        limit,
        cursor,
      },
    })
    links.value = links.value.concat(data.links).filter(Boolean) // Sometimes cloudflare will return null, filter out
    cursor = data.cursor
    listComplete = data.list_complete
    listError = false
  }
  catch (error) {
    console.error(error)
    listError = true
  }
}

const { isLoading } = useInfiniteScroll(
  document,
  getLinks,
  {
    distance: 150,
    interval: 1000,
    canLoadMore: () => {
      return !listError && !listComplete
    },
  },
)

function updateLinkList(link, type) {
  if (type === 'edit') {
    const index = links.value.findIndex(l => l.id === link.id)
    links.value[index] = link
  }
  else if (type === 'delete') {
    const index = links.value.findIndex(l => l.id === link.id)
    links.value.splice(index, 1)
  }
  else {
    links.value.unshift(link)
    sortBy.value = 'newest'
  }
}

function toggleSelection(linkId) {
  if (selectedLinks.value.includes(linkId)) {
    selectedLinks.value = selectedLinks.value.filter(id => id !== linkId)
  }
  else {
    selectedLinks.value.push(linkId)
  }
}

async function deleteSelectedLinks() {
  if (!selectedLinks.value.length) {
    toast.error('No links selected for deletion.')
    return
  }

  try {
    await useAPI('/api/link/delete-batch', {
      method: 'POST',
      body: {
        slugs: selectedLinks.value,
      },
    })
    toast.success('Selected links deleted successfully!')
    selectedLinks.value.forEach((slug) => {
      const index = links.value.findIndex(link => link.slug === slug)
      if (index !== -1)
        links.value.splice(index, 1)
    })
    selectedLinks.value = []
  }
  catch (error) {
    console.error('Batch deletion error:', error)
    toast.error('Failed to delete selected links.')
  }
}

async function deleteAllLinks() {
  if (!links.value.length) {
    toast.error('No links available to delete.')
    return
  }

  try {
    await useAPI('/api/link/delete-all', {
      method: 'POST',
    })
    toast.success('All links deleted successfully!')
    links.value = []
    selectedLinks.value = []
  }
  catch (error) {
    console.error('Delete all error:', error)
    toast.error('Failed to delete all links.')
  }
}
</script>

<template>
  <main class="space-y-6">
    <div class="flex flex-col gap-6 sm:gap-2 sm:flex-row sm:justify-between">
      <DashboardNav class="flex-1">
        <div class="flex items-center gap-2">
          <DashboardLinksEditor @update:link="updateLinkList" />
          <DashboardLinksSort v-model:sort-by="sortBy" />
          <Button variant="outline" @click="deleteSelectedLinks">
            Delete Selected
          </Button>
          <Button variant="outline" @click="deleteAllLinks">
            Delete All
          </Button>
        </div>
      </DashboardNav>
      <LazyDashboardLinksSearch />
    </div>
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="link in displayedLinks"
        :key="link.id"
        class="relative"
      >
        <input
          type="checkbox"
          class="absolute top-2 left-2"
          :value="link.slug"
          @change="toggleSelection(link.slug)"
        >
        <DashboardLinksLink
          :link="link"
          @update:link="updateLinkList"
        />
      </div>
    </section>
    <div
      v-if="isLoading"
      class="flex items-center justify-center"
    >
      <Loader class="animate-spin" />
    </div>
    <div
      v-if="!isLoading && listComplete"
      class="flex items-center justify-center text-sm"
    >
      {{ $t('links.no_more') }}
    </div>
    <div
      v-if="listError"
      class="flex items-center justify-center text-sm"
    >
      {{ $t('links.load_failed') }}
      <Button variant="link" @click="getLinks">
        {{ $t('common.try_again') }}
      </Button>
    </div>
  </main>
</template>
