import Config from '@/config/globalConfig';
import formatAmount from '@/utils/formatAmount';
import getMaterialItemsCount from '@/utils/getMaterialItemsCount';
import getEventOneDayTotal from '@/utils/getEventOneDayTotal';
import getEventOneDayTotalDiscountable from '@/utils/getEventOneDayTotalDiscountable';
import getEventGrandTotal from '@/utils/getEventGrandTotal';
import getEventReplacementTotal from '@/utils/getEventReplacementTotal';
import decimalRound from '@/utils/decimalRound';
import BillEstimateCreationForm from '@/components/BillEstimateCreationForm/BillEstimateCreationForm.vue';

export default {
  name: 'EventBilling',
  components: { BillEstimateCreationForm },
  props: {
    lastBill: Object,
    lastEstimate: Object,
    beneficiaries: Array,
    materials: Array,
    loading: Boolean,
    start: Object,
    end: Object,
  },
  data() {
    let discountRate = 0;
    if (this.lastEstimate) {
      discountRate = this.lastEstimate.discount_rate;
    } else if (this.lastBill) {
      discountRate = this.lastBill.discount_rate;
    }

    return {
      duration: this.end ? this.end.diff(this.start, 'days') + 1 : 1,
      discountRate,
      currency: Config.currency.symbol,
      isBillable: this.beneficiaries.length > 0,
      displayCreateBill: false,
    };
  },
  watch: {
    discountRate(newRate) {
      this.$emit('discountRateChange', Number.parseFloat(newRate));
    },
  },
  computed: {
    userCanEdit() {
      return this.$store.getters['auth/is'](['admin', 'member']);
    },

    pdfUrl() {
      const { baseUrl } = Config;
      const { id } = this.lastBill || { id: null };
      return `${baseUrl}/bills/${id}/pdf`;
    },

    ratio() {
      return Config.degressiveRate(this.duration);
    },

    itemsCount() {
      return getMaterialItemsCount(this.materials);
    },

    total() {
      return getEventOneDayTotal(this.materials);
    },

    grandTotal() {
      return getEventGrandTotal(this.total, this.duration);
    },

    totalDiscountable() {
      return getEventOneDayTotalDiscountable(this.materials);
    },

    grandTotalDiscountable() {
      return getEventGrandTotal(this.totalDiscountable, this.duration);
    },

    discountAmount() {
      return this.grandTotalDiscountable * (this.discountRate / 100);
    },

    discountTarget: {
      get() {
        return decimalRound((this.grandTotal - this.discountAmount));
      },
      set(value) {
        const diff = this.grandTotal - value;
        const rate = 100 * (diff / this.grandTotalDiscountable);
        this.discountRate = decimalRound(rate, 4);
      },
    },

    grandTotalWithDiscount() {
      return this.grandTotal - this.discountAmount;
    },

    replacementTotal() {
      return getEventReplacementTotal(this.materials);
    },
  },
  methods: {
    handleChangeDiscount({ field, value }) {
      if (field === 'amount') {
        this.discountTarget = value;
      } else if (field === 'rate') {
        this.discountRate = value;
      }
    },

    createBill() {
      this.displayCreateBill = false;
      if (this.loading) {
        return;
      }

      this.$emit('createBill', this.discountRate);
    },

    openBillRegeneration() {
      this.displayCreateBill = true;
    },

    closeBillRegeneration() {
      this.displayCreateBill = false;

      if (this.lastEstimate) {
        this.discountRate = this.lastEstimate.discount_rate;
      }
      if (this.lastBill) {
        this.discountRate = this.lastBill.discount_rate;
      }
    },

    formatAmount(amount) {
      return formatAmount(amount);
    },
  },
};
