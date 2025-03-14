import { Card, CardContent, Typography, CardMedia } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { Skeleton } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link, useRouteMatch } from "react-router-dom";
import { IGachaInfo } from "../../types.d";
import { getRemoteAssetURL } from "../../utils";
import { ContentTrans } from "../../components/helpers/ContentTrans";
import SpoilerTag from "../../components/widgets/SpoilerTag";
import { observer } from "mobx-react-lite";
import { useRootStore } from "../../stores/root";

const useStyles = makeStyles((theme) => ({
  media: {
    paddingTop: "56.25%",
    backgroundSize: "contain",
    position: "relative",
  },
  card: {
    // margin: theme.spacing(0.5),
    cursor: "pointer",
  },
  subheader: {
    "white-space": "nowrap",
    overflow: "hidden",
    "text-overflow": "ellipsis",
    "max-width": "260px",
  },
}));

const GridView: React.FC<{ data?: IGachaInfo }> = observer(({ data }) => {
  const classes = useStyles();
  const { path } = useRouteMatch();
  const { region } = useRootStore();

  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (data) {
      getRemoteAssetURL(
        `gacha/${data.assetbundleName}/logo_rip/logo.webp`,
        setUrl,
        window.isChinaMainland ? "cn" : "ww",
        region
      );
    }
  }, [data, region]);

  if (!data) {
    // loading
    return (
      <Card className={classes.card}>
        <Skeleton variant="rectangular" className={classes.media}></Skeleton>
        <CardContent>
          <Typography variant="subtitle1" className={classes.subheader}>
            <Skeleton variant="text" width="90%"></Skeleton>
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Link to={path + "/" + data.id} style={{ textDecoration: "none" }}>
      <Card className={classes.card}>
        <CardMedia className={classes.media} image={url} title={data.name}>
          <SpoilerTag
            style={{
              position: "absolute",
              top: "1%",
              left: "1%",
            }}
            releaseTime={new Date(data.startAt)}
          />
        </CardMedia>
        <CardContent style={{ paddingBottom: "16px" }}>
          <ContentTrans
            contentKey={`gacha_name:${data.id}`}
            original={data.name}
            originalProps={{
              variant: "subtitle1",
              className: classes.subheader,
            }}
            translatedProps={{
              variant: "subtitle1",
              className: classes.subheader,
            }}
          />
          <Typography variant="body2" color="textSecondary">
            {new Date(data.startAt).toLocaleString()} ~
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date(data.endAt).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
});

export default GridView;
