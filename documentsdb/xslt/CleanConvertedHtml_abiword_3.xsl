<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:awml="http://www.abisource.com/2004/xhtml-awml/"
 exclude-result-prefixes="awml"
  >
 <xsl:output omit-xml-declaration="yes"/>
 <xsl:strip-space elements="*"/>

  <xsl:template match="text()">
    <xsl:value-of select="translate(., ' ', ' ')"/>
  </xsl:template>
  
  <xsl:template match="/">
  <div>
    <xsl:choose>
     <xsl:when test="//*[@id = 'main']">
      <xsl:apply-templates select="//*[@id = 'main']"/>
     </xsl:when>
     <xsl:otherwise>
      <xsl:apply-templates/>
     </xsl:otherwise>
    </xsl:choose>
  </div>
 </xsl:template>
 
  <xsl:template match="*[name()='body' or
                        name()='html']">
   <xsl:apply-templates />
 </xsl:template>
  
  <xsl:template match="*[name()='head' or
                        contains(@awml:style, 'header') or
                        contains(@awml:style, 'Header') or
                        contains(@awml:style, 'footer') or
                        contains(@awml:style, 'Footer')]">
  </xsl:template>
 
 <xsl:template match="*[@id = 'main']">
  <xsl:apply-templates />
 </xsl:template>

 <xsl:template match="*[name()='br']">
  <br/>
 </xsl:template>
 
 <xsl:template match="*[name()='p' and
                        not(contains(@awml:style, 'header')) and
                        not(contains(@awml:style, 'Header')) and
                        not(contains(@awml:style, 'Footer')) and
                        not(contains(@awml:style, 'footer'))]">
  <xsl:apply-templates />
  <!-- Normalization for truncated lines at 69 characters -->
  <xsl:choose>
   <xsl:when test="string-length(.//text()) = 69">
      <xsl:text> </xsl:text>
   </xsl:when>
   <xsl:otherwise>
      <br/>
   </xsl:otherwise>
  </xsl:choose>
 </xsl:template>

 <xsl:template match="*[name()='div']">
     <xsl:apply-templates />
     <br/>
 </xsl:template>
 
 <xsl:template match="*[name()='span']">
  <xsl:choose>
   <xsl:when test="contains(@class, 'footnote_reference') and not(contains(../@class, 'footnote_text'))">
    <xsl:element name="{name()}">
      <xsl:attribute name="class">
          <xsl:value-of select="'noteRefNumber'"/>
      </xsl:attribute>
      <xsl:apply-templates />
    </xsl:element>
   </xsl:when>
   <xsl:otherwise>
      <xsl:apply-templates />
   </xsl:otherwise>
  </xsl:choose>
 </xsl:template>

 <xsl:template match="*[name()='ol']">
  <xsl:element name="{name()}">
     <xsl:attribute name="class">
      <xsl:value-of select="'toMark'"/>
     </xsl:attribute>
    <xsl:apply-templates />
   </xsl:element>
 </xsl:template>

 <xsl:template priority="1" match="*[name()='h1' or name()='h2' or name()='h3' or name()='h4' or name()='h5' or name()='h6']">
  <xsl:apply-templates />
 </xsl:template>

 <xsl:template priority="1" match="*[(name()='a' or name()='span' or name()='p') and ./*[name()='table']]">
  <div>
    <xsl:apply-templates select="./*[name()='table']/preceding-sibling::node()"/>
  </div>
  <xsl:apply-templates select="./*[name()='table']"/>
  <div>
    <xsl:apply-templates select="./*[name()='table']/following-sibling::node()"/>
  </div>
 </xsl:template>
 
 <xsl:template match="*[not(name()='a') and
                      not(name()='html') and
                      not(name()='head') and
                      not(name()='body') and
                      not(name()='br') and
                      not(name()='p') and
                      not(name()='span') and
                      not(name()='div') and
                      not(name()='ol') and
                      not(contains(@awml:style, 'header')) and
                      not(contains(@awml:style, 'Header')) and
                      not(contains(@awml:style, 'Footer')) and
                      not(contains(@awml:style, 'footer'))
                      ]">
  <xsl:if test="not(.='')">
   <xsl:element name="{name()}">
    <xsl:for-each select="@*[not(name() = 'class') and 
                             not(name() = 'style') and 
                             not(name() = 'lang') and
                             not(name() = 'xml:lang') and 
                             not(name() = 'dir') and 
                             not(contains(name(), 'awml'))]">
     <xsl:attribute name="{name()}">
      <xsl:value-of select="."/>
     </xsl:attribute>
    </xsl:for-each>
    <xsl:apply-templates />
   </xsl:element>
  </xsl:if>
 </xsl:template>
</xsl:stylesheet>