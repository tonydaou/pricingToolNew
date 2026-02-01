import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import {
  ClientQuoteData,
  generateClientQuoteSummary,
  formatCurrencyValue,
  getCurrencyByCode,
} from "@/lib/clientQuotePDF";

// ✅ Register fonts for professional look
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#0f4c81",
  },
  logo: {
    width: 140,
    height: 60,
    objectFit: "contain",
  },
  headerInfo: {
    textAlign: "right",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f4c81",
    marginBottom: 8,
  },
  headerDate: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f4c81",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f4c81",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: "#f8f9fa",
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: "bold",
  },
  col1: { width: "50%" },
  col2: { width: "20%", textAlign: "center" },
  col3: { width: "30%", textAlign: "right" },
  ynIndicator: {
    textAlign: "center",
    fontWeight: "bold",
  },
  ynYes: {
    color: "#22c55e",
  },
  ynNo: {
    color: "#94a3b8",
  },
  summarySection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#0f4c81",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#444",
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  discountLabel: {
    fontSize: 11,
    color: "#16a34a",
  },
  discountValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#16a34a",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: "#0f4c81",
    paddingHorizontal: 12,
    marginHorizontal: -8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
  currencyNote: {
    fontSize: 9,
    color: "#666",
    textAlign: "right",
    marginBottom: 10,
    fontStyle: "italic",
  },
});

interface ClientQuotePDFProps {
  data: ClientQuoteData;
}

const YNIndicator = ({ value }: { value: boolean }) => (
  <Text style={[styles.ynIndicator, value ? styles.ynYes : styles.ynNo]}>
    {value ? "Y" : "N"}
  </Text>
);

const ClientQuotePDF = ({ data }: ClientQuotePDFProps) => {
  const summary = generateClientQuoteSummary(data);
  const currencyInfo = getCurrencyByCode(summary.currency);
  const currencyLabel = `${currencyInfo.code} (${currencyInfo.name})`;

  const formatCurrency = (amount: number) =>
    formatCurrencyValue(amount, summary.currency, { showDecimals: true });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* ✅ Logo from public/ */}
          <Image style={styles.logo} src="/picacity-logo-pdf.png" />

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Client Quote</Text>
            <Text style={styles.headerDate}>
              Date:{" "}
              {new Date(data.quoteDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.headerDate}>Quote #: {data.quoteName}</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Client Name</Text>
              <Text style={styles.infoValue}>{data.clientName || "—"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Main Asset Type</Text>
              <Text style={styles.infoValue}>{data.mainAsset || "—"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Commitment Period</Text>
              <Text style={styles.infoValue}>
                {data.commitmentYears} Year{data.commitmentYears > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Currency Note */}
        <Text style={styles.currencyNote}>All prices in {currencyLabel}</Text>

        {/* Annual Platform Fee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Annual Platform Fee</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Item</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Included</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>
                Annual Price ({currencyInfo.code})
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                Platform Subscription Fee (Yearly)
              </Text>
              <View style={styles.col2}>
                <YNIndicator value={true} />
              </View>
              <Text style={[styles.tableCellBold, styles.col3]}>
                {formatCurrency(summary.yearlyPlatformFee)}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Fees - Year 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Fees – Year 1</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Service</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Included</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>
                Annual Fee ({currencyInfo.code})
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                Sustainability Module
              </Text>
              <View style={styles.col2}>
                <YNIndicator value={summary.hasSustainability} />
              </View>
              <Text style={[styles.tableCellBold, styles.col3]}>
                {summary.hasSustainability ? "Included" : "—"}
              </Text>
            </View>

            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.col1]}>
                Security Module
              </Text>
              <View style={styles.col2}>
                <YNIndicator value={summary.hasSecurity} />
              </View>
              <Text style={[styles.tableCellBold, styles.col3]}>
                {summary.hasSecurity ? "Included" : "—"}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                Mobility Module
              </Text>
              <View style={styles.col2}>
                <YNIndicator value={summary.hasMobility} />
              </View>
              <Text style={[styles.tableCellBold, styles.col3]}>
                {summary.hasMobility ? "Included" : "—"}
              </Text>
            </View>

            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.col1]}>
                Insight Module
              </Text>
              <View style={styles.col2}>
                <YNIndicator value={summary.hasInsight} />
              </View>
              <Text style={[styles.tableCellBold, styles.col3]}>
                {summary.hasInsight ? "Included" : "—"}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                Support Plan ({summary.supportPlan})
              </Text>
              <View style={styles.col2}>
                <YNIndicator value={true} />
              </View>
              <Text style={[styles.tableCellBold, styles.col3]}>Included</Text>
            </View>

            <View style={[styles.tableRow, { backgroundColor: "#f0f4f8" }]}>
              <Text style={[styles.tableCellBold, styles.col1]}>Year 1 Total</Text>
              <View style={styles.col2} />
              <Text style={[styles.tableCellBold, styles.col3]}>
                {formatCurrency(summary.yearOneSubscription)}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Fees - Year 2 Onwards */}
        {data.commitmentYears > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Subscription Fees – Year 2 Onwards
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.col1]}>Item</Text>
                <Text style={[styles.tableHeaderText, styles.col2]}>Included</Text>
                <Text style={[styles.tableHeaderText, styles.col3]}>
                  Annual Fee ({currencyInfo.code})
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>
                  Annual Subscription Renewal
                </Text>
                <View style={styles.col2}>
                  <YNIndicator value={true} />
                </View>
                <Text style={[styles.tableCellBold, styles.col3]}>
                  {formatCurrency(summary.yearTwoOnwardsSubscription)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Quote Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Grand Total ({data.commitmentYears} Year
              {data.commitmentYears > 1 ? "s" : ""})
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(
                (summary.yearOneSubscription - summary.yearlyPlatformFee) *
                  data.commitmentYears
              )}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subscription Fee ({data.commitmentYears} Year
              {data.commitmentYears > 1 ? "s" : ""})
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.yearlyPlatformFee * data.commitmentYears)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Price</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalBeforeDiscount)}
            </Text>
          </View>

          {summary.discountPercent > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>
                Commitment Discount ({summary.discountPercent}%)
              </Text>
              <Text style={styles.discountValue}>
                -{formatCurrency(summary.discountAmount)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Price After Discount</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(summary.finalTotal)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This quote is valid for 30 days from the date of issue.
          </Text>
          <Text style={styles.footerNote}>
            *All prices are in {currencyLabel} and exclude applicable taxes.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ClientQuotePDF;
