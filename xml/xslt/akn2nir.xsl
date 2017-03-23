<?xml version="1.0" encoding="UTF-8"?>
<!-- 
    CC-by 4.0 CIRSFID- University of Bologna
    Author: CIRSFID, University of Bologna
    Developers: Monica Palmirani, Luca Cervone, Matteo Nardi
    Contacts: monica.palmirani@unibo.it
 -->
<xsl:stylesheet version="2.0"
    xmlns="http://www.normeinrete.it/nir/2.2/"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:dsp="http://www.normeinrete.it/nir/disposizioni/2.2/"
    xmlns:akn="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/WD17"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:h="http://www.w3.org/HTML/1998/html4"
    xmlns:cirsfid="http://www.cirsfid.unibo.it/norma/proprietario/"
    exclude-result-prefixes="xsl dsp akn">
    <xsl:output indent="yes"/>
    <xsl:strip-space elements="*"/>
    

    <FRBRalias value="urn:nir:regione.piemonte:legge:1992-01-14;1" name="urn:nir"/>
    <!-- Variabili -->
    <xsl:variable name="urn">
        <xsl:choose>
            <xsl:when test="//akn:FRBRalias[@name='urn:nir']">
                <xsl:value-of select="//akn:FRBRalias[@name='urn:nir']/@value"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="cirsfid:convertiUri(//akn:FRBRWork/akn:FRBRuri/@value)"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
    
    <!-- Radice -->
    <xsl:template match="akn:akomaNtoso">
        <NIR>
            <xsl:apply-templates select="node()|@*"/>
        </NIR>
    </xsl:template>
    
    <xsl:template match="akn:doc|akn:act">
        <DocumentoNIR nome="{@name}">
            <xsl:apply-templates/>
        </DocumentoNIR>
    </xsl:template>
    
    <!-- Meta -->
    <xsl:template match="akn:meta">
        <meta>
            <!-- descrittori -->
            <xsl:call-template name="generaDescrittori"/>
            <!-- inquadramento -->
            <xsl:call-template name="generaInquadramento"/>
            <!-- ciclodivita -->
            <xsl:call-template name="generaCiclodivita"/>
            <!-- redazionale -->
            <xsl:call-template name="generaRedazionale"/>
            <!-- modifiche -->
            <xsl:call-template name="generaModificheAttive"/>
            <!-- proprietario -->
            <xsl:call-template name="generaProprietario"/>
        </meta>
    </xsl:template>
    
    <xsl:template name="generaDescrittori">
        <descrittori>
            <pubblicazione
                tipo="{//akn:publication/@name}"
                num="{//akn:publication/@number}"
                norm="{translate(//akn:publication/@date, '-', '')}"/>
            
            <entratainvigore norm="{translate(//akn:eventRef[@type='generation']/@date, '-', '')}"/>
            
            <!-- Todo: Redazione -->
            
            <urn valore="{$urn}"/>
            
            <xsl:if test="//akn:keyword">
                <materie>
                    <xsl:for-each select="//akn:keyword">
                        <materia valore="{@value}"/>
                    </xsl:for-each>
                </materie>
            </xsl:if>
        </descrittori>
    </xsl:template>
    
    <xsl:template name="generaInquadramento">
        <inquadramento>
            <infodoc>
                <xsl:attribute name="normativa">
                    <xsl:if test="//akn:FRBRprescriptive/@value='true'">si</xsl:if>
                    <xsl:if test="//akn:FRBRprescriptive/@value='false'">no</xsl:if>
                </xsl:attribute>
                <!-- Todo: mancano natura="decreto" funzione="regolativa" fonte="primario" -->
            </infodoc>
            
            <infomancanti>
                <mTipodoc valore="{//akn:FRBRname/@value}"/>
                <Emanante valore="{//akn:TLCOrganization[@eId='emanante']/@showAs}"/>
                <!--<mTitolodoc valore=""/>-->
                <!--<mDatadoc valore=""/>-->
                <!--<mNumdoc valore=""/>-->
            </infomancanti>
        </inquadramento>
    </xsl:template>
    
    <xsl:template name="generaCiclodivita">
        <ciclodivita>
            <eventi>
                <xsl:for-each select="//akn:eventRef">
                    <evento id="{@eId}" data="{translate(@date, '-', '')}" fonte="{@source}">
                        <xsl:attribute name="tipo">
                            <xsl:if test="@type='generation'">originale</xsl:if>
                            <xsl:if test="@type='amendment'">modifica</xsl:if>
                        </xsl:attribute>
                    </evento>
                </xsl:for-each>
            </eventi>
            <relazioni>
                <!-- Originale -->
                <xsl:for-each select="//akn:references/akn:original">
                    <originale id="{@eId}" xlink:href="urn:nir:ministero.sviluppo.economico:decreto:2009-12-09;nir-n2100396">
                        <xsl:attribute name="xlink:href">
                            <xsl:value-of select="cirsfid:convertiUri(@href)"/>
                        </xsl:attribute>
                    </originale>
                </xsl:for-each>
                <!-- Modifiche attive -->
                <xsl:for-each select="//akn:references/akn:activeRef">
                    <attiva id="{@eId}">
                        <xsl:attribute name="xlink:href">
                            <xsl:value-of select="cirsfid:convertiUri(@href)"/>
                        </xsl:attribute>
                    </attiva>
                </xsl:for-each>
            </relazioni>
        </ciclodivita>
    </xsl:template>
    
    <xsl:template name="generaRedazionale">
        <xsl:if test="//akn:notes | //akn:authorialNote">
            <redazionale>
                <xsl:for-each select="//akn:authorialNote">
                    <avvertenza><xsl:apply-templates/></avvertenza>
                </xsl:for-each>
                <xsl:for-each select="//akn:note">
                    <nota id="{@eId}"><xsl:apply-templates/></nota>
                </xsl:for-each>
            </redazionale>
        </xsl:if>
    </xsl:template>
    
    <xsl:template name="generaModificheAttive">
        <xsl:if test="//akn:activeModifications">
            <modificheattive>
                <!-- attuadelegifica -->
                <xsl:apply-templates select="//akn:activeModifications/*"/>
            </modificheattive>
        </xsl:if>
    </xsl:template>
       
    <xsl:template name="generaProprietario">
        <xsl:copy-of select="//proprietario"/>
    </xsl:template>
    
    <!-- Disposizioni -->
    <xsl:template match="akn:source">
        <dsp:pos xlink:href="{@href}"/>
    </xsl:template>
    
    <!--    urn:nir:stato:decreto.legislativo:1999-07-30;300/ita/1999-07-30#art4-com4"
xlink:href="urn:nir:stato:decreto.legislativo:1999-07-30;300">
    -->
    <xsl:template match="akn:destination">
        <xsl:variable name="urn">
            <xsl:value-of select="cirsfid:convertiUri(@href)"/>
        </xsl:variable>
        <xsl:variable name="id" select="substring-after(@href, '#')"/>
        <dsp:norma xlink:href="{$urn}">
            <dsp:subarg>
                <cirsfid:sub xlink:href="urn{concat($urn, '#', $id)}"/>
            </dsp:subarg>
        </dsp:norma>
    </xsl:template>
    
    <xsl:template match="akn:legalSystemMod[@type='deregulation']">
        <dsp:attuadelegifica><xsl:apply-templates/></dsp:attuadelegifica>
    </xsl:template>
    <xsl:template match="akn:textualMod[@type='repeal']">
        <dsp:abrogazione><xsl:apply-templates/></dsp:abrogazione>
    </xsl:template>
    <xsl:template match="akn:textualMod[@type='substitution']">
        <dsp:sostituzione><xsl:apply-templates/></dsp:sostituzione>
    </xsl:template>
    <xsl:template match="akn:textualMod[@type='insertion']">
        <dsp:integrazione><xsl:apply-templates/></dsp:integrazione>
    </xsl:template>
    <xsl:template match="akn:textualMod[@type='renumbering']">
        <dsp:ricollocazione><xsl:apply-templates/></dsp:ricollocazione>
    </xsl:template>
    <xsl:template match="akn:meaningMod[@type='authenticInterpretation']">
        <dsp:intautentica><xsl:apply-templates/></dsp:intautentica>
    </xsl:template>
    <xsl:template match="akn:meaningMod[@type='variation']">
        <dsp:variazione><xsl:apply-templates/></dsp:variazione>
    </xsl:template>
    <xsl:template match="akn:meaningMod[@type='termModification']">
        <dsp:modtermini><xsl:apply-templates/></dsp:modtermini>
    </xsl:template>
    <xsl:template match="akn:forceMod[@type='entryIntoForce']">
        <dsp:vigenza><xsl:apply-templates/></dsp:vigenza>
    </xsl:template>
    <xsl:template match="akn:forceMod[@type='uncostitutionality']">
        <dsp:annullamento><xsl:apply-templates/></dsp:annullamento>
    </xsl:template>
    <xsl:template match="akn:efficacyMod[@type='prorogationOfEfficacy']">
        <dsp:proroga><xsl:apply-templates/></dsp:proroga>
    </xsl:template>
    <!-- ??? -> dsp:reviviscenza -->
    <xsl:template match="akn:efficacyMod[@type='retroactivity']">
        <dsp:retroattivita><xsl:apply-templates/></dsp:retroattivita>
    </xsl:template>
    <xsl:template match="akn:efficacyMod[@type='extraEfficacy']">
        <dsp:ultrattivita><xsl:apply-templates/></dsp:ultrattivita>
    </xsl:template>
    <xsl:template match="akn:efficacyMod[@type='inapplication']">
        <dsp:inapplicazione><xsl:apply-templates/></dsp:inapplicazione>
    </xsl:template>
    <xsl:template match="akn:scopeMod[@type='exceptionOfScope'][@incomplete='true']">
        <dsp:deroga><xsl:apply-templates/></dsp:deroga>
    </xsl:template>
    <xsl:template match="akn:scopeMod[@type='extensionOfScope']">
        <dsp:estensione><xsl:apply-templates/></dsp:estensione>
    </xsl:template>
    <!--Bug
    <xsl:template match="akn:scopeMod[@type='exceptionOfScope'][@incomplete='true']">
        <dsp:estensione><xsl:apply-templates/></dsp:estensione>
    </xsl:template>
    -->
    <xsl:template match="akn:legalSystemMod[@type='application']">
        <dsp:recepisce><xsl:apply-templates/></dsp:recepisce>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='implementation']">
        <dsp:attua><xsl:apply-templates/></dsp:attua>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='ratification']">
        <dsp:ratifica><xsl:apply-templates/></dsp:ratifica>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='legislativeDelegation']">
        <dsp:attuadelega><xsl:apply-templates/></dsp:attuadelega>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='deregulation']">
        <dsp:attuadelegifica><xsl:apply-templates/></dsp:attuadelegifica>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='conversion']">
        <dsp:converte><xsl:apply-templates/></dsp:converte>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='reiteration']">
        <dsp:reitera><xsl:apply-templates/></dsp:reitera>
    </xsl:template>  
    <!--??? -\-> dsp:modifica--> 
    <xsl:template match="akn:legalSystemMod[@type='reiteration']">
        <dsp:reitera><xsl:apply-templates/></dsp:reitera>
    </xsl:template>
    <xsl:template match="akn:legalSystemMod[@type='expiration']">
        <dsp:decadimento><xsl:apply-templates/></dsp:decadimento>
    </xsl:template>    
    
    <!-- Intestazione -->
    <xsl:template match="akn:preface">
        <intestazione><xsl:apply-templates select="node()|@*"/></intestazione>
    </xsl:template>
    
    <xsl:template match="akn:docAuthority">
        <emanante><xsl:apply-templates select="node()|@*"/></emanante>
    </xsl:template>
    
    <xsl:template match="akn:docType">
        <tipoDoc><xsl:apply-templates select="node()|@*"/></tipoDoc>
    </xsl:template>
    
    <xsl:template match="akn:docDate">
        <dataDoc norm="{translate(@date, '-', '')}"><xsl:apply-templates select="node()|@*"/></dataDoc>
    </xsl:template>
    
    <xsl:template match="akn:docTitle">
        <titoloDoc><xsl:apply-templates select="node()|@*"/></titoloDoc>
    </xsl:template>
    
    <xsl:template match="akn:docNumber">
        <numDoc><xsl:apply-templates select="node()|@*"/></numDoc>
    </xsl:template>
    
    <!-- Formula iniziale -->
    <xsl:template match="akn:preamble">
        <formulainiziale><xsl:apply-templates select="node()|@*"/></formulainiziale>
    </xsl:template>
    
    <xsl:template match="akn:container[@name='preambolo_nir']">
        <preambolo><xsl:apply-templates select="node()|@*"/></preambolo>
    </xsl:template>
    
    
    <!-- Body -->
    <xsl:template match="akn:mainBody">
        <articolato><xsl:apply-templates select="node()|@*"/></articolato>
    </xsl:template>
    
    <xsl:template match="akn:body">
        <articolato><xsl:apply-templates select="node()|@*"/></articolato>
    </xsl:template>
    
    <xsl:template match="akn:num">
        <num><xsl:apply-templates select="node()|@*"/></num>
    </xsl:template>
    
    <xsl:template match="akn:heading">
        <rubrica><xsl:apply-templates select="node()|@*"/></rubrica>
    </xsl:template>
    
    <xsl:template match="akn:content">
        <corpo><xsl:apply-templates select="node()|@*"/></corpo>
    </xsl:template>
    
    <xsl:template match="akn:article">
        <articolo><xsl:apply-templates select="node()|@*"/></articolo>
    </xsl:template>
    
    <xsl:template match="akn:paragraph">
        <comma><xsl:apply-templates select="node()|@*"/></comma>
    </xsl:template>
    
    <!-- Conclusioni -->
    <xsl:template match="akn:conclusions">
        <xsl:apply-templates mode="conclusion" 
            select="akn:container[@name='formulafinale'] | *[not(self::akn:container[@name='formulafinale'])][1]"/>
    </xsl:template>
    
    <xsl:template mode="conclusion" match="akn:container[@name='formulafinale']">
        <formulafinale><xsl:apply-templates select="node()|@*"/></formulafinale>
    </xsl:template>
    
    <xsl:template mode="conclusion" match="*">
       <conclusione>
           <xsl:apply-templates select="../*[not(self::akn:container[@name='formulafinale'])]"/>
        </conclusione>
    </xsl:template>
    
    <xsl:template match="akn:conclusions//akn:date">
        <dataeluogo norm="{translate(@date, '-', '')}"><xsl:apply-templates select="node()|@*"/></dataeluogo>
    </xsl:template>
    
    <xsl:template match="akn:signature">
        <xsl:variable name="refersTo" select="@refersTo"/>
        <firma>
            <xsl:if test="//akn:TLCConcept[$refersTo=concat('#', @eId)][@href='/ontology/concepts/it/visto']">
                <xsl:attribute name="tipo">visto</xsl:attribute>
            </xsl:if>
            <xsl:if test="//akn:TLCConcept[$refersTo=concat('#', @eId)][@href='/ontology/concepts/it/sottoscrizione']">
                <xsl:attribute name="tipo">sottoscrizione</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates select="node()|@*"/>
        </firma>
    </xsl:template>
    
    <!-- Elementi interni del contenuto -->
    <xsl:template match="akn:p">
        <h:p><xsl:apply-templates select="node()|@*"/></h:p>
    </xsl:template>
    
    <xsl:template match="akn:p/akn:omissis">
        <h:p><xsl:apply-templates select="node()|@*"/></h:p>
    </xsl:template>
    
    <xsl:template match="akn:eol">
        <h:br><xsl:apply-templates select="node()|@*"/></h:br>
    </xsl:template>
    
    <xsl:template match="akn:container">
        <contenitore nome="{@name}"><xsl:apply-templates select="node()|@*"/></contenitore>
    </xsl:template>
    
    <xsl:template match="akn:noteRef">
        <ndr num="{@href}"><xsl:apply-templates select="node()|@*"/></ndr>
    </xsl:template>
    
    <xsl:template match="akn:ref">
        <rif>
            <xsl:attribute name="xlink:href">
                <xsl:value-of select="cirsfid:convertiUri(@href)"/>
            </xsl:attribute>
            <xsl:apply-templates select="node()|@*"/>
        </rif>
    </xsl:template>

    <xsl:template match="akn:date">
        <data norm="{translate(@date, '-', '')}"><xsl:apply-templates select="node()|@*"/></data>
    </xsl:template>
    
    <xsl:template match="akn:list/akn:point">
        <el><xsl:apply-templates select="node()|@*"/></el>
    </xsl:template>
    
    <xsl:template match="akn:intro">
        <alinea><xsl:apply-templates select="node()|@*"/></alinea>
    </xsl:template>

    <!-- Quoted elements -->
    <xsl:template match="akn:quotedStructure">
        <virgolette tipo="struttura"><xsl:apply-templates select="node()|@*"/></virgolette>
    </xsl:template>
    
    <xsl:template match="akn:quotedText">
        <virgolette tipo="parola"><xsl:apply-templates select="node()|@*"/></virgolette>
    </xsl:template>

    <!-- Utility -->
  
    <xsl:template match="@eId">
        <!-- Preserva l'id degli elementi a cui si hanno riferimenti -->
        <xsl:if test="//@href=concat('#', .)">
            <xsl:attribute name="id">
                <xsl:value-of select="."/>
            </xsl:attribute>
        </xsl:if>
    </xsl:template>
    
    <xsl:template match="@*"></xsl:template>

    <xsl:function name="cirsfid:convertiUri">
        <xsl:param name="uri"/>
        <xsl:variable name="main" select="tokenize($uri, '#')[1]"/>
        <xsl:variable name="id" select="tokenize($uri, '#')[2]"/>
        <xsl:if test="$main">
            <xsl:value-of select="cirsfid:convertiUriMain(cirsfid:removeLastSlash($main))"/>
        </xsl:if>
        <xsl:if test="$id">
            <xsl:text>#</xsl:text>
            <xsl:value-of select="cirsfid:convertiId($id)"/>
        </xsl:if>
    </xsl:function>

    <xsl:function name="cirsfid:removeLastSlash">
        <xsl:param name="str"/>
        <xsl:choose>
            <xsl:when test="ends-with($str, '/')">
                <xsl:value-of select="substring($str, 1, string-length($str)-1)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$str"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="cirsfid:convertiUriMain">
        <xsl:param name="uri"/>
        <xsl:variable name="dateRegex" select="'\d{4}-\d{2}-\d{2}'"/>
        <xsl:variable name="beforeAfterDate" select="tokenize($uri, $dateRegex)"/>
        <xsl:variable name="beforeDateParts" select="tokenize(cirsfid:removeLastSlash(substring-after($beforeAfterDate[1], '/')), '/')"/>
        <xsl:variable name="afterDateParts" select="tokenize(substring-after($beforeAfterDate[2], '/'), '/')"/>

        <xsl:variable name="docDate" select="substring-before(substring-after($uri, $beforeAfterDate[1]), $beforeAfterDate[2])"/>
        <xsl:variable name="docType" select="cirsfid:getDocType($beforeDateParts)"/>
        <xsl:variable name="authority" select="cirsfid:getAuthority($beforeDateParts)"/>
        <xsl:variable name="docNum" select="cirsfid:getDocNum($afterDateParts[1])"/>

        <xsl:variable name="estremiAtto" select="cirsfid:getEstremiAtto($docDate, $docNum)"/>
        <xsl:value-of select="string-join( ('urn:nir', $authority, $docType, $estremiAtto), ':' )"/>
        <xsl:variable name="component" select="cirsfid:getComponent($afterDateParts[last()])"/>
        <xsl:if test="$component">
            <xsl:value-of select="concat(':', $component)"/>
        </xsl:if>
    </xsl:function>

    <xsl:function name="cirsfid:convertiId">
        <xsl:param name="eId"/>
        <xsl:variable name="eId0" select="replace($eId, '__', '-')"/>
        <xsl:variable name="eId1" select="replace($eId0, '_', '')"/>
        <xsl:variable name="eId2" select="replace($eId1, 'para', 'com')"/>
        <xsl:variable name="eId3" select="replace($eId2, 'part', 'prt')"/>
        <xsl:variable name="eId3" select="replace($eId2, 'qstr', 'vir')"/>
        <xsl:value-of select="$eId3"/>
    </xsl:function>

    <xsl:function name="cirsfid:getDocType">
        <xsl:param name="beforeDateUriParts"/>
        <xsl:choose>
            <xsl:when test="count($beforeDateUriParts) ge 4 ">
                <xsl:value-of select="$beforeDateUriParts[4]"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="'legge'"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>

    <xsl:function name="cirsfid:getAuthority">
        <xsl:param name="beforeDateUriParts"/>
        <xsl:choose>
            <xsl:when test="count($beforeDateUriParts) = 5 ">
                <xsl:value-of select="$beforeDateUriParts[5]"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="'stato'"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>

    <xsl:function name="cirsfid:getDocNum">
        <xsl:param name="afterDateUriPart"/>
        <xsl:choose>
            <xsl:when test="not(matches($afterDateUriPart, '^((\w\w\w@) | (\d{4}-\d{2}-\d{2}))')) and
                        not(starts-with($afterDateUriPart, '!')) and
                        not(ends-with($afterDateUriPart, '.xml')) and
                        not(ends-with($afterDateUriPart, '.akn'))">
                <xsl:value-of select="$afterDateUriPart"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="'nir-1'"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>

    <xsl:function name="cirsfid:getEstremiAtto">
        <xsl:param name="docDate"/>
        <xsl:param name="docNum"/>
        <xsl:value-of select="concat($docDate, ';', $docNum)"/>
    </xsl:function>

    <xsl:function name="cirsfid:getComponent">
        <xsl:param name="potentialComponent"/>
        <xsl:if test="starts-with($potentialComponent, '!') and $potentialComponent != '!main'">
            <xsl:value-of select="substring($potentialComponent, 2)"/>
        </xsl:if>
    </xsl:function>
</xsl:stylesheet>