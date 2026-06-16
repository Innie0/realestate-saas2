'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import {
  type CmaPdfBranding,
  type CmaPdfPayload,
  conditionLabel,
  formatPdfDate,
  formatPdfMoney,
} from '@/lib/cma-pdf-types';

function createStyles(primary: string, secondary: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 40,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#1f2937',
    },
    headerBar: {
      backgroundColor: primary,
      marginHorizontal: -40,
      marginTop: -36,
      paddingHorizontal: 40,
      paddingVertical: 20,
      marginBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#ffffff',
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
    },
    headerSubtitle: {
      color: '#ffffff',
      fontSize: 9,
      marginTop: 4,
      opacity: 0.9,
    },
    logo: {
      width: 72,
      height: 36,
      objectFit: 'contain',
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: secondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    box: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
      padding: 12,
      marginBottom: 14,
    },
    priceHero: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: primary,
      marginBottom: 4,
    },
    priceRange: {
      fontSize: 11,
      color: '#4b5563',
    },
    gridRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
    },
    statPill: {
      backgroundColor: '#f9fafb',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      fontSize: 9,
      color: '#374151',
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#4b5563',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    colAddress: { width: '34%' },
    colPrice: { width: '14%', textAlign: 'right' },
    colAdj: { width: '14%', textAlign: 'right' },
    colDetails: { width: '22%' },
    colSold: { width: '16%', textAlign: 'right' },
    th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280' },
    td: { fontSize: 8, color: '#374151' },
    tdBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: primary },
    twoCol: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    halfBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
      padding: 10,
    },
    refLabel: { fontSize: 9, color: '#6b7280', marginBottom: 4 },
    refValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#374151' },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      paddingTop: 10,
    },
    footerAgent: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    footerContact: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 2,
    },
    disclaimer: {
      fontSize: 7,
      color: '#9ca3af',
      marginTop: 6,
      lineHeight: 1.4,
    },
    meta: {
      fontSize: 8,
      color: '#9ca3af',
      marginBottom: 14,
    },
  });
}

export interface CmaPdfDocumentProps {
  report: CmaPdfPayload;
  branding: CmaPdfBranding;
}

export function CmaPdfDocument({ report, branding }: CmaPdfDocumentProps) {
  const styles = createStyles(branding.primaryColor, branding.secondaryColor);
  const { subject, valuation } = report;
  const reportDate = formatPdfDate(report.generatedAt);

  return (
    <Document title={`CMA — ${report.address}`} author={branding.agentName}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>Comparative Market Analysis</Text>
            <Text style={styles.headerSubtitle}>
              {report.address}
              {report.propertyType ? ` · ${report.propertyType}` : ''}
            </Text>
          </View>
          {branding.logoUrl ? (
            <Image src={branding.logoUrl} style={styles.logo} />
          ) : null}
        </View>

        <Text style={styles.meta}>
          Prepared {reportDate} · {valuation.compCount} comparable sale
          {valuation.compCount !== 1 ? 's' : ''} within {report.radius} mi ·{' '}
          {report.yearsBack} yr history
        </Text>

        <View style={styles.box}>
          <Text style={styles.sectionTitle}>Suggested list price</Text>
          {valuation.suggestedPrice ? (
            <View>
              <Text style={styles.priceHero}>{formatPdfMoney(valuation.suggestedPrice)}</Text>
              <Text style={styles.priceRange}>
                Estimated range: {formatPdfMoney(valuation.priceLow)} –{' '}
                {formatPdfMoney(valuation.priceHigh)}
              </Text>
            </View>
          ) : (
            <Text style={styles.priceRange}>
              Insufficient comparable sales for a price estimate. Widen search radius or history.
            </Text>
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.sectionTitle}>Subject property</Text>
          <View style={styles.gridRow}>
            {subject.bedrooms !== null && (
              <Text style={styles.statPill}>{subject.bedrooms} beds</Text>
            )}
            {subject.bathrooms !== null && (
              <Text style={styles.statPill}>{subject.bathrooms} baths</Text>
            )}
            {subject.squareFootage !== null && (
              <Text style={styles.statPill}>
                {subject.squareFootage.toLocaleString()} sq ft
              </Text>
            )}
            {subject.yearBuilt !== null && (
              <Text style={styles.statPill}>Built {subject.yearBuilt}</Text>
            )}
            {subject.lotSize !== null && (
              <Text style={styles.statPill}>
                Lot {subject.lotSize.toLocaleString()} sq ft
              </Text>
            )}
            <Text style={styles.statPill}>Condition: {conditionLabel(subject.condition)}</Text>
            {subject.hasPool && <Text style={styles.statPill}>Pool</Text>}
            {subject.garageSpaces > 0 && (
              <Text style={styles.statPill}>{subject.garageSpaces} garage spaces</Text>
            )}
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.halfBox}>
            <Text style={styles.refLabel}>AVM reference (automated estimate)</Text>
            {report.avm?.estimatedValue ? (
              <View>
                <Text style={styles.refValue}>{formatPdfMoney(report.avm.estimatedValue)}</Text>
                {(report.avm.valueLow || report.avm.valueHigh) && (
                  <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                    {formatPdfMoney(report.avm.valueLow)} – {formatPdfMoney(report.avm.valueHigh)}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.refValue}>—</Text>
            )}
          </View>
          <View style={styles.halfBox}>
            <Text style={styles.refLabel}>Rent estimate</Text>
            {report.rentEstimate?.monthlyRent ? (
              <Text style={styles.refValue}>
                {`${formatPdfMoney(report.rentEstimate.monthlyRent)}/mo`}
              </Text>
            ) : (
              <Text style={styles.refValue}>—</Text>
            )}
          </View>
        </View>

        {report.summary ? (
          <View style={styles.box}>
            <Text style={styles.sectionTitle}>Market summary</Text>
            <Text style={styles.summaryText}>{report.summary}</Text>
          </View>
        ) : null}

        {report.comps.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.sectionTitle}>Comparable sales</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colAddress]}>Address</Text>
              <Text style={[styles.th, styles.colPrice]}>Sold</Text>
              <Text style={[styles.th, styles.colAdj]}>Adjusted</Text>
              <Text style={[styles.th, styles.colDetails]}>Details</Text>
              <Text style={[styles.th, styles.colSold]}>Date</Text>
            </View>
            {report.comps.map((comp, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, styles.colAddress]}>{comp.address}</Text>
                <Text style={[styles.tdBold, styles.colPrice]}>
                  {formatPdfMoney(comp.price)}
                </Text>
                <Text style={[styles.td, styles.colAdj]}>
                  {formatPdfMoney(comp.adjustedPrice)}
                </Text>
                <Text style={[styles.td, styles.colDetails]}>
                  {[
                    comp.bedrooms !== null ? `${comp.bedrooms} bd` : null,
                    comp.bathrooms !== null ? `${comp.bathrooms} ba` : null,
                    comp.squareFootage !== null
                      ? `${comp.squareFootage.toLocaleString()} sf`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text style={[styles.td, styles.colSold]}>{formatPdfDate(comp.soldDate)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerAgent}>
            {branding.agentName}
            {branding.agentHeadline ? ` · ${branding.agentHeadline}` : ''}
          </Text>
          <Text style={styles.footerContact}>
            {[branding.agentPhone, branding.agentEmail].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.disclaimer}>
            This Comparative Market Analysis is for informational purposes only and is not an
            appraisal. All data is deemed reliable but not guaranteed. Pricing recommendations
            should be verified by a licensed professional. Prepared via Realestic.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
