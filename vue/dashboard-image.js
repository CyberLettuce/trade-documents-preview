import {dashboardImageSize} from '../assets/dashboard-image.js?v=2026-11-24-dashboard-image-size-r1';

export const FeaturedDashboardImage = {
  props:{block:Object},
  methods:{dashboardImageSize},
  template:`<figure v-if="block" class="exporter-dashboard-image" :data-size="dashboardImageSize(block)">
    <img :src="block.image" :alt="block.alt||block.title" translate="no">
    <figcaption translate="no"><strong>{{block.title}}</strong><p v-if="block.caption">{{block.caption}}</p></figcaption>
  </figure>`
};
