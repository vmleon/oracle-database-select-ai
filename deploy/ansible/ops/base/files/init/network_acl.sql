WHENEVER SQLERROR EXIT SQL.SQLCODE

BEGIN
    DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
        host => 'oraclecloud.com',
        ace  => xs$ace_type(
            privilege_list => xs$name_list('http'),
            principal_name => 'ADMIN',
            principal_type => xs_acl.ptype_db
        )
    );
END;
/

EXIT;
