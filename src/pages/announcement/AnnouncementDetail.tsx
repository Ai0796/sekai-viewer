import {
  Avatar,
  Chip,
  Container,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import MarkdownIt from "markdown-it";
// @ts-ignore
import MarkdownItCollapsible from "markdown-it-collapsible";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import { AnnouncementModel, UserMetadatumModel } from "../../strapi-model";
import { useLayoutStyles } from "../../styles/layout";
import { useStrapi } from "../../utils/apiClient";
import Comment from "../comment/Comment";
import CommentTextMultiple from "~icons/mdi/comment-text-multiple";
import { useQuery } from "../../utils";
import { useRootStore } from "../../stores/root";
// import AdSense from "../../components/blocks/AdSense";
import { observer } from "mobx-react-lite";

const AnnouncementDetail: React.FC<{}> = observer(() => {
  const layoutClasses = useLayoutStyles();
  const { id } = useParams<{ id: string }>();
  const query = useQuery();
  const {
    user: { metadata },
  } = useRootStore();
  const { getAnnouncementById, getTranslationBySlug } = useStrapi();
  const { t } = useTranslation();

  const mdParser = useMemo(
    () =>
      new MarkdownIt({ linkify: true, typographer: true }).use(
        MarkdownItCollapsible
      ),
    []
  );

  const [announcement, setAnnouncement] = useState<AnnouncementModel>();
  const [contributors, setContributors] = useState<UserMetadatumModel[]>([]);

  useLayoutEffect(() => {
    document.title = t("title:announcementDetail", {
      name: announcement?.title,
    });
  }, [announcement, t]);

  useEffect(() => {
    getAnnouncementById(
      id,
      query.get("preview")
        ? {
            _publicationState: "preview",
          }
        : {}
    ).then(setAnnouncement);
    getTranslationBySlug(`announcement:${id}`, "target").then(
      (data) =>
        data[0] &&
        setContributors(
          data[0].users.filter((meta) => meta.id !== (metadata || { id: 0 }).id)
        )
    );
  }, [getAnnouncementById, getTranslationBySlug, id, query, metadata]);

  return !!announcement ? (
    <Fragment>
      <Typography variant="h6" className={layoutClasses.header}>
        {announcement.title}
      </Typography>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <Typography variant="subtitle2" color="textSecondary">
            {t("announcement:category")}:{" "}
            {t(`announcement:categoryName.${announcement.category}`)}
          </Typography>
        </Grid>
        {/* <Grid item>
          <Chip
            label={announcement.user.nickname}
            avatar={
              <Avatar
                src={
                  announcement.user.avatar ? announcement.user.avatar.url : ""
                }
              />
            }
          />
        </Grid> */}
        <Grid item>
          <Typography variant="subtitle2" color="textSecondary">
            {t("announcement:published_at")}:{" "}
            {new Date(announcement.created_at).toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Divider style={{ margin: "1% 0" }} />
      <Container className={layoutClasses.content}>
        {!!contributors.length && (
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <Typography color="textSecondary">
                {t("announcement:translators")}
              </Typography>
            </Grid>
            <Grid item>
              <Grid container spacing={1}>
                {contributors.map((userMeta) => (
                  <Grid item>
                    <Chip
                      label={userMeta.nickname}
                      avatar={
                        <Avatar
                          src={userMeta.avatar ? userMeta.avatar.url : ""}
                        />
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        )}
        <br />
        <MdEditor
          value={announcement.content}
          renderHTML={(text) => mdParser.render(text)}
          config={{
            view: { html: true, md: false, menu: false },
            canView: { html: true, md: false, menu: false, hideMenu: false },
          }}
          readOnly
        />
      </Container>
      {/* <AdSense
        client="ca-pub-7767752375383260"
        slot="2771743585"
        format="auto"
        responsive="true"
      /> */}
      {!query.get("preview") && (
        <Fragment>
          <Typography variant="h6" className={layoutClasses.header}>
            {t("common:comment")} <CommentTextMultiple />
          </Typography>
          <Container className={layoutClasses.content} maxWidth="md">
            <Comment contentType="announcement" contentId={Number(id)} />
          </Container>
        </Fragment>
      )}
    </Fragment>
  ) : (
    <Typography variant="h6" className={layoutClasses.header}>
      Loading...
    </Typography>
  );
});

export default AnnouncementDetail;
