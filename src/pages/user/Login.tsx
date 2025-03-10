import {
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
  Link,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AccountCircle, Twitter, VpnKey } from "@mui/icons-material";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import Discord from "~icons/mdi/discord";
import React, { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, Link as RouteLink } from "react-router-dom";
import { useInteractiveStyles } from "../../styles/interactive";
// import { useInteractiveStyles } from "../../styles/interactive";
import { useLayoutStyles } from "../../styles/layout";
import { LoginValues } from "../../strapi-model";
import {
  apiUserInfoToStoreUserInfo,
  useAlertSnackbar,
  useQuery,
} from "../../utils";
import { useStrapi } from "../../utils/apiClient";
import { observer } from "mobx-react-lite";
import { useRootStore } from "../../stores/root";
import { IUserMetadata } from "../../stores/user";

const Login: React.FC<{}> = observer(() => {
  const theme = useTheme();
  const layoutClasses = useLayoutStyles();
  const interactiveClasses = useInteractiveStyles();
  const { t } = useTranslation();
  const query = useQuery();
  const history = useHistory();
  const {
    postLoginLocal,
    getRedirectConnectLoginUrl,
    getUserMetadataMe,
    // getSekaiProfileMe,
    // getSekaiCardTeamMe,
  } = useStrapi();
  const { showError } = useAlertSnackbar();
  const {
    // jwtToken,
    decodedToken,
    user: { setToken, setUserInfo, setMetadata },
  } = useRootStore();

  useEffect(() => {
    if (query.get("error")) showError(query.get("error")!);
  }, [query, showError]);

  const matchMdUp = useMediaQuery(theme.breakpoints.up("md"));

  useEffect(() => {
    document.title = t("title:login");
  }, [t]);

  return (
    <Fragment>
      <Typography variant="h6" className={layoutClasses.header}>
        {t("common:login")}
      </Typography>
      <Container className={layoutClasses.content} maxWidth="md">
        <Formik
          initialValues={{
            // @ts-ignore
            identifier: decodedToken ? decodedToken.identifier : "",
            password: "",
          }}
          validate={(values) => {
            const errors: Partial<LoginValues> = {};
            if (!values.identifier) {
              errors.identifier = t("auth:error.required");
            }
            if (!values.password) {
              errors.password = t("auth:error.required");
            }
            return errors;
          }}
          onSubmit={async (values, { setErrors }) => {
            try {
              const data = await postLoginLocal(values);
              // jwtAuth.token = data.jwt;
              // jwtAuth.user = data.user;
              // jwtAuth.usermeta = await getUserMetadataMe(data.jwt);
              setToken(data.jwt);
              setUserInfo(apiUserInfoToStoreUserInfo(data.user));
              setMetadata((await getUserMetadataMe(data.jwt)) as IUserMetadata);
              // updateSekaiProfile(await getSekaiProfileMe(data.jwt));
              // updateSekaiCardTeam(await getSekaiCardTeamMe(data.jwt));
              history.replace("/user");
              // window.location.reload();
              localStorage.setItem(
                "lastUserCheck",
                String(new Date().getTime())
              );
            } catch (error: any) {
              // console.log(error.response.data);
              if (error.id === "Auth.form.error.invalid")
                setErrors({
                  identifier: t("auth:login.error.invalid"),
                  password: t("auth:login.error.invalid"),
                });
              else if (error.id === "Auth.form.error.confirmed")
                setErrors({
                  identifier: t("auth:login.error.email_not_confirmed"),
                });
            }
          }}
        >
          {({ submitForm, isSubmitting, errors, dirty, isValid }) => (
            <Grid container justifyContent="center">
              <Grid item xs={12} md={6} container justifyContent="center">
                <Form>
                  <Field
                    component={TextField}
                    name="identifier"
                    type="text"
                    label={t("auth:login.label.identifier")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle />
                        </InputAdornment>
                      ),
                    }}
                  ></Field>
                  <br />
                  <br />
                  <Field
                    component={TextField}
                    name="password"
                    type="password"
                    label={t("auth:login.label.password")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey />
                        </InputAdornment>
                      ),
                    }}
                  ></Field>
                  <br />
                  <br />
                  <Grid container direction="column" spacing={1}>
                    <Grid item>
                      <RouteLink
                        to="/user/forgot"
                        className={interactiveClasses.noDecoration}
                      >
                        <Typography variant="caption" color="textPrimary">
                          {t("auth:forgot-password")}
                        </Typography>
                      </RouteLink>
                    </Grid>
                    <Grid item>
                      <RouteLink
                        to="/user/signup"
                        className={interactiveClasses.noDecoration}
                      >
                        <Typography variant="caption" color="textPrimary">
                          {t("auth:no-account-signup")}
                        </Typography>
                      </RouteLink>
                    </Grid>
                  </Grid>
                  <br />
                  <input type="submit" style={{ display: "none" }} />
                  <Grid container spacing={1}>
                    <Grid
                      item
                      xs={12}
                      container
                      alignItems="center"
                      spacing={1}
                    >
                      <Grid item>
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={isSubmitting || !dirty || !isValid}
                          onClick={submitForm}
                        >
                          {t("auth:common.loginButton")}
                        </Button>
                      </Grid>
                      {isSubmitting && (
                        <Grid item>
                          <CircularProgress size={24} />
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Form>
              </Grid>
              <Grid item xs={12} md={1}>
                <Divider
                  orientation={matchMdUp ? "vertical" : "horizontal"}
                  style={{ margin: matchMdUp ? "0 1rem" : "1rem 0" }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Grid
                  container
                  direction="column"
                  // alignItems="center"
                  spacing={1}
                >
                  <Grid item>
                    <Typography>{t("auth:login.connect.desc")}</Typography>
                  </Grid>
                  <Grid item>
                    <Button
                      component={Link}
                      href={getRedirectConnectLoginUrl("discord")}
                      // variant="contained"
                      startIcon={<Discord />}
                    >
                      {t("auth:login.connect.discord")}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      component={Link}
                      href={getRedirectConnectLoginUrl("twitter")}
                      // variant="contained"
                      startIcon={<Twitter />}
                    >
                      {t("auth:login.connect.twitter")}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Formik>
      </Container>
    </Fragment>
  );
});

export default Login;
