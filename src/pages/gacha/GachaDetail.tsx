import {
  Button,
  Card,
  CardMedia,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  DialogProps,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { useLayoutStyles } from "../../styles/layout";
import { TabContext, TabPanel } from "@mui/lab";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import Viewer from "react-viewer";
import { ImageDecorator } from "react-viewer/lib/ViewerProps";
import {
  GachaBehavior,
  GachaCardRarityRate,
  GachaDetail,
  GachaStatistic,
  ICardInfo,
  ICardRarity,
  IGachaCeilItem,
  IGachaInfo,
} from "../../types.d";
import { getRemoteAssetURL, useCachedData } from "../../utils";
import { CardThumb, CardThumbs } from "../../components/widgets/CardThumb";
import rarityNormal from "../../assets/rarity_star_normal.png";
import { useTranslation } from "react-i18next";
import { useAssetI18n } from "../../utils/i18n";
import { ContentTrans } from "../../components/helpers/ContentTrans";
import { useInteractiveStyles } from "../../styles/interactive";
import CommonMaterialIcon from "../../components/widgets/CommonMaterialIcon";
// import AdSense from "../../components/blocks/AdSense";
import { observer } from "mobx-react-lite";
import { useRootStore } from "../../stores/root";
import rarityBirthday from "../../assets/rarity_birthday.png";

const gachaImageNameMap: {
  [key: number]: {
    bg: string;
    feature?: string;
  };
} = {
  1: {
    bg: "bg_gacha1",
    feature: "img_gacha1_1",
  },
  2: {
    bg: "bg_gacha_rare3_ticket_2020",
  },
  3: {
    bg: "bg_gacha_virtualsinger_2020",
  },
  7: {
    bg: "bg_gacha6",
    feature: "img_gacha6",
  },
  8: {
    bg: "bg_gacha8",
  },
};

const useStyles = makeStyles((theme) => ({
  media: {
    paddingTop: "56.25%",
    cursor: "pointer",
  },
  card: {
    margin: theme.spacing(0.5),
  },
  tabpanel: {
    padding: theme.spacing("1%", 0, 0, 0),
  },
  subheader: {
    "white-space": "nowrap",
    overflow: "hidden",
    "text-overflow": "ellipsis",
    "max-width": "260px",
  },
  gachaBtn: {
    padding: theme.spacing(1, 3.5),
  },
  bannerImg: {
    maxWidth: "100%",
  },
}));

const StarIcon: React.FC<{ num: number; right?: boolean }> = ({
  num,
  right = false,
}) => (
  <Grid container justifyContent={right ? "flex-end" : "inherit"}>
    <Grid item>
      {Array.from({ length: num }).map((_, idx) => (
        <img key={idx} src={rarityNormal} alt="star" height="24px" />
      ))}
    </Grid>
  </Grid>
);

const BirthdayIcon = () => (
  <img src={rarityBirthday} alt="star" height="24px" />
);

const DescDialog: React.FC<
  { title: string; content: string } & DialogProps
> = ({ title, content, ...props }) => {
  return (
    <Dialog {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography style={{ whiteSpace: "pre-line" }}>{content}</Typography>
      </DialogContent>
    </Dialog>
  );
};

const GachaDetailPage: React.FC<{}> = observer(() => {
  const classes = useStyles();
  const layoutClasses = useLayoutStyles();
  const interactiveClasses = useInteractiveStyles();
  const { gachaId } = useParams<{ gachaId: string }>();
  const { t } = useTranslation();
  const { getTranslated } = useAssetI18n();
  const {
    settings: { contentTransMode },
    region,
  } = useRootStore();

  const [gachas] = useCachedData<IGachaInfo>("gachas");
  const [gachaCeilItems] = useCachedData<IGachaCeilItem>("gachaCeilItems");
  const [cards] = useCachedData<ICardInfo>("cards");
  const [rarities] = useCachedData<ICardRarity>("cardRarities");

  const [gacha, setGacha] = useState<IGachaInfo>();
  const [gachaCeilItem, setGachaCeilItem] = useState<IGachaCeilItem>();
  const [visible, setVisible] = useState<boolean>(false);
  const [picTabVal, setPicTabVal] = useState<string>("2");
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [statistic, setStatistic] = useState<GachaStatistic>({
    spinCount: 0,
    cost: {
      ticket: 0,
      jewel: 0,
    },
    counts: [],
  });
  const [currentGachaResult, setCurrentGachaResult] = useState<GachaDetail[]>(
    []
  );
  const [gachaRarityRates, setGachaRarityRates] = useState<
    (GachaCardRarityRate & ICardRarity)[]
  >([]);
  const [weights, setWeights] = useState<number[]>([]);
  const [normalRates, setNormalRates] = useState<number[]>([]);
  const [guaranteedRates, setGuaranteedRates] = useState<number[]>([]);
  const [isSummaryDialog, setIsSummaryDialog] = useState(false);
  const [isDescDialog, setIsDescDialog] = useState(false);
  const [isCardsDialog, setIsCardsDialog] = useState(false);
  const [gachaCards, setGachaCards] = useState<number[]>([]);

  const doGacha = useCallback(
    (behavior: GachaBehavior) => {
      if (!gacha || !rarities || !cards) return;
      const rollTimes = behavior.spinCount;
      // console.log(rollTimes);
      const rollResult = gachaRarityRates.map(() => 0);
      const normalSum = normalRates.reduce(
        (sum, curr) => [...sum, curr + (sum.slice(-1)[0] || 0)],
        [] as number[]
      );
      const guaranteeSum = guaranteedRates.reduce(
        (sum, curr) => [...sum, curr + (sum.slice(-1)[0] || 0)],
        [] as number[]
      );
      const rollableCards = gachaRarityRates.map((rate) =>
        gacha.gachaDetails
          .filter((gd) =>
            rate.cardRarityType
              ? cards.find((card) => card.id === gd.cardId)?.cardRarityType ===
                rate.cardRarityType
              : cards.find((card) => card.id === gd.cardId)?.rarity ===
                rate.rarity
          )
          .sort((a, b) => a.weight - b.weight)
      );
      const rollWeights = rollableCards.map((elem) =>
        elem?.map((_elem) => _elem.weight)
      );
      const tmpGachaResult: GachaDetail[] = [];
      const isOverRarity = behavior.gachaBehaviorType.startsWith("over_rarity");
      const overRarity = isOverRarity
        ? behavior.gachaBehaviorType === "over_rarity_3_once"
          ? 3
          : 4
        : 0;
      let noOverRarityCount = 0;
      for (let i = 0; i < rollTimes; i++) {
        // console.log(i, rollTimes);
        if (i % 10 === 9 && isOverRarity && noOverRarityCount === 9) {
          // only roll 3* or 4*
          const roll = Math.random() * 100;
          const idx = guaranteeSum.findIndex((rate) => roll < rate);
          rollResult[idx] += 1;
          const weightArr = rollWeights[idx].reduce(
            (sum, curr) => [...sum, curr + (sum.slice(-1)[0] || 0)],
            [] as number[]
          );
          const weightSum = weights[idx];
          const rand = Math.floor(Math.random() * weightSum);
          tmpGachaResult.push(
            rollableCards[idx][
              weightArr.filter((weight) => weight <= rand).length
            ]
          );
          noOverRarityCount = 0;
          continue;
        } else if (i % 10 === 0) {
          noOverRarityCount = 0;
        }
        const roll = Math.random() * 100;
        const idx = normalSum.findIndex((rate) => roll < rate);
        rollResult[idx] += 1;
        const weightArr = rollWeights[idx].reduce(
          (sum, curr) => [...sum, curr + (sum.slice(-1)[0] || 0)],
          [] as number[]
        );
        const weightSum = weights[idx];
        const rand = Math.floor(Math.random() * weightSum);
        tmpGachaResult.push(
          rollableCards[idx][
            weightArr.filter((weight) => weight <= rand).length
          ]
        );

        if (isOverRarity && gachaRarityRates[idx].rarity < 3)
          noOverRarityCount += 1;
      }

      setStatistic((stats) =>
        Object.assign({}, stats, {
          spinCount: stats.spinCount + behavior.spinCount,
          cost: {
            jewel:
              behavior.costResourceType === "jewel"
                ? stats.cost.jewel + behavior.costResourceQuantity
                : stats.cost.jewel,
            ticket:
              behavior.costResourceType === "gacha_ticket"
                ? stats.cost.ticket + behavior.costResourceQuantity
                : stats.cost.ticket,
          },
          counts: stats.counts.map((count, idx) => rollResult[idx] + count),
        })
      );

      setCurrentGachaResult(tmpGachaResult.slice(-10));
    },
    [
      cards,
      gacha,
      gachaRarityRates,
      guaranteedRates,
      normalRates,
      rarities,
      weights,
    ]
  );

  const resetGacha = useCallback(() => {
    setStatistic((stats) => ({
      spinCount: 0,
      cost: {
        jewel: 0,
        ticket: 0,
      },
      counts: stats.counts.map(() => 0),
    }));
    setCurrentGachaResult([]);
  }, []);

  useLayoutEffect(() => {
    if (gachas && gachas.length && !gacha)
      setGacha(gachas.find((elem) => elem.id === Number(gachaId)));
  }, [gacha, gachaId, gachas]);

  useLayoutEffect(() => {
    if (gacha && gachaCeilItems && gachaCeilItems.length && !gachaCeilItem) {
      setGachaCeilItem(
        gachaCeilItems.find((elem) => elem.id === gacha.gachaCeilItemId)
      );
    }
  }, [gacha, gachaCeilItem, gachaCeilItems]);

  useLayoutEffect(() => {
    if (gacha && rarities) {
      const name = getTranslated(`gacha_name:${gachaId}`, gacha.name);
      document.title = t("title:gachaDetail", {
        name,
      });
      let rates: (GachaCardRarityRate & ICardRarity)[] = [];
      if (gacha.gachaCardRarityRates) {
        rates = [...gacha.gachaCardRarityRates]
          .sort((a, b) => b.rate - a.rate)
          .map((rate) =>
            Object.assign(
              {},
              rate,
              rarities.find(
                (rarity) => rarity.cardRarityType === rate.cardRarityType
              )
            )
          );
      } else {
        rates = rarities.map((rarity) =>
          Object.assign({}, rarity, {
            id: 0,
            groupId: 0,
            cardRarityType: "",
            rate: gacha[`rarity${rarity.rarity}Rate` as "rarity1Rate"],
          })
        );
      }
      rates = rates.filter((rate) => rate.rate);
      setGachaRarityRates(rates);
      setNormalRates(rates.map((rate) => rate.rate));

      const sumRates = rates.reduce(
        (sum, curr) => [...sum, curr.rate + (sum.slice(-1)[0] || 0)],
        [] as number[]
      );
      if (
        gacha.gachaBehaviors.find(
          (gb) => gb.gachaBehaviorType === "over_rarity_3_once"
        )
      ) {
        const grs = rates.map((rate) => rate.rate);
        const rarity3Idx = rates.findIndex((rate) =>
          rate.cardRarityType
            ? rate.cardRarityType === "rarity_3"
            : rate.rarity === 3
        )!;
        grs[rarity3Idx] = sumRates[rarity3Idx];
        rates.forEach((rate, idx) => {
          if (rate.rarity < 3) {
            grs[idx] = 0;
          }
        });
        setGuaranteedRates(grs);
      } else if (
        gacha.gachaBehaviors.find(
          (gb) => gb.gachaBehaviorType === "over_rarity_4_once"
        )
      ) {
        const grs = [...sumRates];
        const rarity4Idx = rates.findIndex((rate) =>
          rate.cardRarityType
            ? rate.cardRarityType === "rarity_4"
            : rate.rarity === 4
        )!;
        grs[rarity4Idx] = sumRates[rarity4Idx];
        rates.forEach((rate, idx) => {
          if (rate.rarity < 4) {
            grs[idx] = 0;
          }
        });
        setGuaranteedRates(grs);
      }

      setStatistic((stats) =>
        Object.assign({}, stats, {
          counts: rates.map(() => 0),
        })
      );
    }
  }, [gacha, contentTransMode, gachaId, getTranslated, t, rarities]);

  useLayoutEffect(() => {
    if (cards && gacha && gachaRarityRates) {
      const weightArr = gachaRarityRates.map((rate) => 0);
      gacha.gachaDetails.forEach((detail) => {
        const card = cards.find((elem) => elem.id === detail.cardId)!;
        weightArr[
          gachaRarityRates.findIndex((rate) =>
            rate.cardRarityType
              ? rate.cardRarityType === card.cardRarityType
              : rate.rarity === card.rarity
          )
        ] += detail.weight;
      });
      console.log(weightArr);
      setWeights(weightArr);
    }
  }, [cards, gacha, gachaRarityRates]);

  const [gachaBackground, setGachaBackground] = useState<string>("");
  const [gachaImage, setGachaImage] = useState<string>("");
  const [gachaIcon, setGachaIcon] = useState<string>("");
  const [gachaBanner, setGachaBanner] = useState("");
  const [gachaCeilItemIcon, setGachaCeilItemIcon] = useState("");

  useLayoutEffect(() => {
    if (gacha) {
      getRemoteAssetURL(
        `gacha/${gacha.assetbundleName}/screen_rip/texture/${
          (gachaImageNameMap[gacha.id] || { bg: `bg_gacha${gacha.id}` }).bg
        }.webp`,
        setGachaBackground,
        window.isChinaMainland ? "cn" : "ww",
        region
      );
      getRemoteAssetURL(
        `gacha/${gacha.assetbundleName}/screen_rip/texture/${
          (gachaImageNameMap[gacha.id] || { feature: `img_gacha${gacha.id}` })
            .feature
        }.webp`,
        setGachaImage,
        window.isChinaMainland ? "cn" : "ww",
        region
      );
      getRemoteAssetURL(
        `gacha/${gacha.assetbundleName}/logo_rip/logo.webp`,
        setGachaIcon,
        window.isChinaMainland ? "cn" : "ww",
        region
      );
      getRemoteAssetURL(
        `home/banner/banner_gacha${gacha.id}_rip/banner_gacha${gacha.id}.webp`,
        setGachaBanner,
        window.isChinaMainland ? "cn" : "ww",
        region
      );
    }
  }, [gacha, region]);

  useLayoutEffect(() => {
    if (gachaCeilItem) {
      getRemoteAssetURL(
        `thumbnail/gacha_item_rip/${gachaCeilItem.assetbundleName}.webp`,
        setGachaCeilItemIcon
      );
    }
  }, [gachaCeilItem]);

  const getGachaImages: (gacha: IGachaInfo) => ImageDecorator[] = useCallback(
    (gacha) => {
      const ret: ImageDecorator[] = [];
      if (gachaImageNameMap[gacha.id]) {
        if (gachaImageNameMap[gacha.id].bg) {
          ret.push({
            src: gachaBackground,
            alt: "background",
            downloadUrl: gachaBackground.replace(".webp", ".png"),
          });
        }
        if (gachaImageNameMap[gacha.id].feature) {
          ret.push({
            src: gachaImage,
            alt: "feature",
            downloadUrl: gachaImage.replace(".webp", ".png"),
          });
        }
      } else {
        ret.push({
          src: gachaBackground,
          alt: "background",
          downloadUrl: gachaBackground.replace(".webp", ".png"),
        });
        ret.push({
          src: gachaImage,
          alt: "feature",
          downloadUrl: gachaImage.replace(".webp", ".png"),
        });
      }

      return ret;
    },
    [gachaBackground, gachaImage]
  );

  const handleChange = (event: React.ChangeEvent<{}>, newValue: string) => {
    setPicTabVal(newValue);
  };

  const getCardRate = useCallback(
    (cardId: number) => {
      if (gacha && gachaRarityRates.length && cards && cards.length) {
        const detail = gacha.gachaDetails.find(
          (detail) => detail.cardId === cardId
        )!;
        const card = cards.find((card) => card.id === cardId)!;

        let idx;
        if (card.cardRarityType) {
          idx = gachaRarityRates.findIndex(
            (rarity) => rarity.cardRarityType === card.cardRarityType
          );
        } else {
          idx = gachaRarityRates.findIndex(
            (rarity) => rarity.rarity === card.rarity
          );
        }

        return (
          Math.round((detail.weight / weights[idx]) * normalRates[idx] * 1000) /
            1000 +
          " %" +
          ((card.rarity >= 3 &&
            gacha.gachaBehaviors.some(
              (behavior) => behavior.gachaBehaviorType === "over_rarity_3_once"
            )) ||
          (card.rarity >= 4 &&
            gacha.gachaBehaviors.some(
              (behavior) => behavior.gachaBehaviorType === "over_rarity_4_once"
            ))
            ? "\n" +
              Math.round(
                (detail.weight / weights[idx]) * guaranteedRates[idx] * 1000
              ) /
                1000 +
              " %"
            : "")
        );
      }
      return "";
    },
    [cards, gacha, gachaRarityRates, guaranteedRates, normalRates, weights]
  );

  if (gacha) {
    return (
      <Fragment>
        <Typography variant="h6" className={layoutClasses.header}>
          {getTranslated(`gacha_name:${gachaId}`, gacha.name)}
        </Typography>
        <Container className={layoutClasses.content} maxWidth="md">
          <TabContext value={picTabVal}>
            <Paper>
              <Tabs
                value={picTabVal}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons
              >
                <Tab label={t("gacha:tab.title.banner_logo")} value="2"></Tab>
                {gachaBackground && (
                  <Tab label={t("gacha:tab.title[3]")} value="0"></Tab>
                )}
                {gachaImage && (
                  <Tab label={t("gacha:tab.title[4]")} value="1"></Tab>
                )}
              </Tabs>
              <TabPanel value="0" classes={{ root: classes.tabpanel }}>
                <Card
                  onClick={() => {
                    setActiveIdx(0);
                    setVisible(true);
                  }}
                >
                  <CardMedia
                    className={classes.media}
                    image={gachaBackground}
                  ></CardMedia>
                </Card>
              </TabPanel>
              <TabPanel value="1" classes={{ root: classes.tabpanel }}>
                <Card
                  onClick={() => {
                    setActiveIdx(1);
                    setVisible(true);
                  }}
                >
                  <CardMedia
                    className={classes.media}
                    image={gachaImage}
                  ></CardMedia>
                </Card>
              </TabPanel>
              <TabPanel value="2" classes={{ root: classes.tabpanel }}>
                <Grid container direction="row">
                  <Grid item xs={12} md={6}>
                    <img
                      className={classes.bannerImg}
                      src={gachaIcon}
                      alt="logo"
                    ></img>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {gachaBanner && (
                      <img
                        className={classes.bannerImg}
                        src={gachaBanner}
                        alt="banner"
                      ></img>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </TabContext>
          {/* <Container style={{marginTop: '2%'}} maxWidth="md"> */}
          <Grid container direction="column">
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("common:id")}
              </Typography>
              <Typography>{gacha.id}</Typography>
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("common:title")}
              </Typography>
              <ContentTrans
                contentKey={`gacha_name:${gachaId}`}
                original={gacha.name}
                originalProps={{ align: "right" }}
                translatedProps={{ align: "right" }}
              />
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("common:startAt")}
              </Typography>
              <Typography>
                {new Date(gacha.startAt).toLocaleString()}
              </Typography>
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("common:endAt")}
              </Typography>
              <Typography>{new Date(gacha.endAt).toLocaleString()}</Typography>
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("common:type")}
              </Typography>
              <Typography>
                {t(`gacha:gachaType.${gacha.gachaType as "ceil"}`)}
              </Typography>
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
            {gacha.gachaType === "ceil" && (
              <Fragment>
                <Grid
                  item
                  container
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                    {t("gacha:ceil_item")}
                  </Typography>
                  <img src={gachaCeilItemIcon} alt="gacha ceil item" />
                </Grid>
                <Divider style={{ margin: "1% 0" }} />
              </Fragment>
            )}
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("gacha:summary")}
              </Typography>
              <Button
                onClick={() => setIsSummaryDialog(true)}
                variant="contained"
              >
                {t("common:show")}
              </Button>
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
            <Grid
              item
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                {t("gacha:description")}
              </Typography>
              <Button onClick={() => setIsDescDialog(true)} variant="contained">
                {t("common:show")}
              </Button>
            </Grid>
            <Divider style={{ margin: "1% 0" }} />
          </Grid>
        </Container>
        <Typography variant="h6" className={layoutClasses.header}>
          {t("gacha:gacha_rate")}
        </Typography>
        <Container className={layoutClasses.content} maxWidth="md">
          <Grid container direction="row">
            {!!gachaRarityRates && !!normalRates.length && (
              <Fragment>
                <Grid item xs={12}>
                  <Grid
                    container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Grid item xs={2} md={4}>
                      <Typography
                        variant="subtitle1"
                        style={{ fontWeight: 600 }}
                      >
                        {t("gacha:normalRate")}
                      </Typography>
                    </Grid>
                    <Grid item xs={9} md={4}>
                      <Grid
                        container
                        direction="row"
                        alignItems="flex-end"
                        spacing={1}
                      >
                        {gachaRarityRates.map((rate, idx) => (
                          <Grid item xs={12} key={idx}>
                            <Grid container alignItems="center">
                              <Grid item xs={7}>
                                {rate.cardRarityType === "rarity_birthday" ? (
                                  <Grid container justifyContent="flex-end">
                                    <Grid item>
                                      <BirthdayIcon />
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <StarIcon num={rate.rarity} right />
                                )}
                              </Grid>
                              <Grid item xs={5}>
                                <Grid container justifyContent="flex-end">
                                  <Grid item>{normalRates[idx]} %</Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider style={{ margin: "1% 0" }} />
                </Grid>
              </Fragment>
            )}
            {!!gachaRarityRates && !!guaranteedRates.length && (
              <Fragment>
                <Grid item xs={12}>
                  <Grid
                    container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Grid item xs={2} md={4}>
                      <Typography
                        variant="subtitle1"
                        style={{ fontWeight: 600 }}
                      >
                        {t("gacha:guaranteedRate")}
                      </Typography>
                    </Grid>
                    <Grid item xs={9} md={4}>
                      <Grid
                        container
                        direction="row"
                        alignItems="flex-end"
                        spacing={1}
                      >
                        {gachaRarityRates.map((rate, idx) => (
                          <Grid item xs={12} key={idx}>
                            <Grid container alignItems="center">
                              <Grid item xs={7}>
                                {rate.cardRarityType === "rarity_birthday" ? (
                                  <Grid container justifyContent="flex-end">
                                    <Grid item>
                                      <BirthdayIcon />
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <StarIcon num={rate.rarity} right />
                                )}
                              </Grid>
                              <Grid item xs={5}>
                                <Grid container justifyContent="flex-end">
                                  <Grid item>{guaranteedRates[idx]} %</Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider style={{ margin: "1% 0" }} />
                </Grid>
              </Fragment>
            )}
          </Grid>
        </Container>
        <Typography variant="h6" className={layoutClasses.header}>
          {t("gacha:gacha_cards")}
        </Typography>
        <Container className={layoutClasses.content} maxWidth="md">
          <Grid container direction="row">
            <Grid item xs={12}>
              <Grid
                container
                wrap="nowrap"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                  {t("gacha:pickupMember", {
                    count: gacha.gachaPickups.length,
                  })}
                </Typography>
                <Button
                  onClick={() => {
                    setGachaCards(
                      gacha.gachaPickups.map((pickup) => pickup.cardId)
                    );
                    setIsCardsDialog(true);
                  }}
                  variant="contained"
                >
                  {t("common:show")}
                </Button>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Divider style={{ margin: "1% 0" }} />
            </Grid>
            {gachaRarityRates.map((rate, idx) => (
              <Fragment key={idx}>
                <Grid item xs={12}>
                  <Grid
                    container
                    wrap="nowrap"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Grid item>
                      {rate.cardRarityType === "rarity_birthday" ? (
                        <Grid container justifyContent="flex-end">
                          <Grid item>
                            <BirthdayIcon />
                          </Grid>
                        </Grid>
                      ) : (
                        <StarIcon num={rate.rarity} />
                      )}
                    </Grid>
                    <Button
                      onClick={() => {
                        if (!cards || !cards.length) return;
                        setGachaCards(
                          gacha.gachaDetails
                            .map((detail) => detail.cardId)
                            .filter((cardId) =>
                              rate.cardRarityType
                                ? cards.find((card) => card.id === cardId)!
                                    .cardRarityType === rate.cardRarityType
                                : cards.find((card) => card.id === cardId)!
                                    .rarity === rate.rarity
                            )
                        );
                        setIsCardsDialog(true);
                      }}
                      variant="contained"
                    >
                      {t("common:show")}
                    </Button>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider style={{ margin: "1% 0" }} />
                </Grid>
              </Fragment>
            ))}
          </Grid>
        </Container>
        <Typography variant="h6" className={layoutClasses.header}>
          {t("gacha:gacha_behaviors")}
        </Typography>
        <Container className={layoutClasses.content} maxWidth="md">
          <Grid container direction="row">
            {gacha.gachaBehaviors.map((behavior) => (
              <Fragment key={behavior.id}>
                <Grid item xs={12}>
                  <Grid
                    container
                    wrap="nowrap"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Grid item>
                      <Typography
                        variant="subtitle1"
                        style={{ fontWeight: 600 }}
                      >
                        {t("gacha:behavior." + behavior.gachaBehaviorType)}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <CommonMaterialIcon
                        materialName={behavior.costResourceType}
                        quantity={behavior.costResourceQuantity}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider style={{ margin: "1% 0" }} />
                </Grid>
              </Fragment>
            ))}
          </Grid>
        </Container>
        {/* <AdSense
          client="ca-pub-7767752375383260"
          slot="8221864477"
          format="auto"
          responsive="true"
        /> */}
        <Typography variant="h6" className={layoutClasses.header}>
          {t("gacha:gacha_simulator")}
        </Typography>
        <Container className={layoutClasses.content} maxWidth="md">
          <Grid
            container
            spacing={1}
            justifyContent="center"
            alignItems="center"
          >
            {gacha.gachaBehaviors.map((behavior, idx) => (
              <Grid item key={idx}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Grid container justifyContent="center">
                      <Grid item>
                        <Button
                          variant="contained"
                          className={classes.gachaBtn}
                          color="primary"
                          onClick={() => doGacha(behavior)}
                        >
                          {/* {t("gacha:behavior." + behavior.gachaBehaviorType)} */}
                          <CommonMaterialIcon
                            materialName={behavior.costResourceType}
                            quantity={behavior.costResourceQuantity}
                            mini
                          />
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            ))}
            <Grid item>
              <Button
                variant="contained"
                className={classes.gachaBtn}
                color="secondary"
                onClick={() => resetGacha()}
              >
                {t("gacha:simulator.reset")}
              </Button>
            </Grid>
          </Grid>
          <br />
          <Grid container spacing={1} justifyContent="center">
            <Grid item>
              <Typography>
                {t("gacha:simulator.total")}: {statistic.spinCount}
              </Typography>
            </Grid>
            <Grid item>
              <Typography>
                {t("gacha:simulator.jewel")}: {statistic.cost.jewel}
              </Typography>
            </Grid>
            <Grid item>
              <Typography>
                {t("gacha:simulator.ticket")}: {statistic.cost.ticket}
              </Typography>
            </Grid>
          </Grid>
          <br />
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Grid container>
                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("common:rarity")}</TableCell>
                          <TableCell>{t("gacha:simulator.count")}</TableCell>
                          <TableCell>
                            {t("gacha:simulator.percentage")}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {gachaRarityRates.map((rate, idx) => (
                          <Fragment key={idx}>
                            <TableRow>
                              <TableCell>
                                {rate.cardRarityType === "rarity_birthday" ? (
                                  <Grid container>
                                    <Grid item>
                                      <BirthdayIcon />
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <StarIcon num={rate.rarity} />
                                )}
                              </TableCell>
                              <TableCell>{statistic.counts[idx]}</TableCell>
                              <TableCell>
                                {statistic.spinCount
                                  ? (
                                      (statistic.counts[idx] /
                                        statistic.spinCount) *
                                      100
                                    ).toFixed(2)
                                  : 0}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <br />
          <CardThumbs cardIds={currentGachaResult.map((elem) => elem.cardId)} />
        </Container>
        <Viewer
          visible={visible}
          onClose={() => setVisible(false)}
          images={getGachaImages(gacha)}
          zIndex={2000}
          activeIndex={activeIdx}
          downloadable
          downloadInNewWindow
          onMaskClick={() => setVisible(false)}
          zoomSpeed={0.25}
          onChange={(_, idx) => setActiveIdx(idx)}
        />
        <DescDialog
          open={isSummaryDialog}
          onClose={() => setIsSummaryDialog(false)}
          title={t("gacha:summary")}
          content={gacha.gachaInformation.summary}
        />
        <DescDialog
          open={isDescDialog}
          onClose={() => setIsDescDialog(false)}
          title={t("gacha:description")}
          content={gacha.gachaInformation.description}
        />
        <Dialog
          open={isCardsDialog}
          onClose={() => {
            setGachaCards([]);
            setIsCardsDialog(false);
          }}
          fullWidth
        >
          <DialogTitle>{t("gacha:gacha_cards")}</DialogTitle>
          <DialogContent>
            <Grid container spacing={1}>
              {gachaCards.map((cardId) => (
                <Grid key={cardId} item xs={4} md={2}>
                  <Link
                    to={"/card/" + cardId}
                    className={interactiveClasses.noDecoration}
                    target="_blank"
                  >
                    <Grid container direction="column">
                      <CardThumb cardId={cardId} />
                      <Typography
                        align="center"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {getCardRate(cardId)}
                      </Typography>
                    </Grid>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
        </Dialog>
      </Fragment>
    );
  } else {
    return (
      <div>
        Loading... If you saw this for a while, gacha {gachaId} does not exist.
      </div>
    );
  }
});

export default GachaDetailPage;
