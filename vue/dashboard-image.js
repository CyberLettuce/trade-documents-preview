export const FeaturedDashboardImage = {
  props:{block:Object},
  template:`<figure v-if="block" class="exporter-dashboard-image">
    <img :src="block.image" :alt="block.alt||block.title" translate="no">
    <figcaption translate="no"><strong>{{block.title}}</strong><p v-if="block.caption">{{block.caption}}</p></figcaption>
  </figure>`
};
